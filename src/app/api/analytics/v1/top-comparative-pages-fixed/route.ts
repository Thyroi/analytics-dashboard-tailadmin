// src/app/api/analytics/v1/top-comparative-pages-fixed/route.ts
import type { Granularity, SeriesPoint } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { addDaysUTC, todayUTC } from "@/lib/utils/time/datetime";
import {
  buildLaggedAxisForGranularity,
  type AxisLagged,
} from "@/lib/utils/time/timeAxis";
import type { GoogleAuth } from "google-auth-library";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------- tipos/helpers ---------- */

/** Obtener dimensions customizadas de GA4 */
async function fetchDimensionApiNames(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  propertyId: string
): Promise<string[]> {
  const name = `${normalizePropertyId(propertyId)}/metadata`;
  const meta = await analyticsData.properties.getMetadata({ name });
  return (
    meta.data.dimensions?.map((d) => d.apiName ?? "").filter((s) => s) ?? []
  );
}

/** Resolver dimension customizada */
function resolveCustomEventDim(
  available: string[],
  base: string
): string | undefined {
  const candidates = [
    `customEvent:${base.toLowerCase()}`,
    `customEvent:${base.charAt(0).toUpperCase()}${base.slice(1)}`,
    `customEvent:${base}`,
  ];

  const availLC = available.map((a) => a.toLowerCase());
  for (const cand of candidates) {
    const idx = availLC.indexOf(cand.toLowerCase());
    if (idx >= 0) return available[idx];
  }

  // Fallback por sufijo
  const suffix = `:${base.toLowerCase()}`;
  const idx = availLC.findIndex(
    (a) => a.startsWith("customevent:") && a.endsWith(suffix)
  );
  if (idx >= 0) return available[idx];

  return undefined;
}

/** Serie temporal para una URL específica usando el patrón de drilldown/url */
async function fetchUrlSeries(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  property: string,
  axis: AxisLagged,
  targetUrl: string,
  dimsAvailable: string[]
): Promise<{ current: SeriesPoint[]; previous: SeriesPoint[] }> {
  const puebloDimName = resolveCustomEventDim(dimsAvailable, "pueblo");
  const categoriaDimName = resolveCustomEventDim(dimsAvailable, "categoria");

  const N = axis.xLabels.length;

  // Usar filtros AND para eventName Y pageLocation exacta (como en drilldown/url)
  const seriesFilters: analyticsdata_v1beta.Schema$FilterExpression[] = [
    {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: "page_view",
          caseSensitive: false,
        },
      },
    },
    {
      filter: {
        fieldName: "pageLocation",
        stringFilter: {
          matchType: "EXACT",
          value: targetUrl,
          caseSensitive: false,
        },
      },
    },
  ];

  // Construir dimensiones para series: tiempo + pageLocation + eventName + customs
  const seriesDimensions: analyticsdata_v1beta.Schema$Dimension[] = [
    { name: axis.dimensionTime }, // "date" | "yearMonth"
    { name: "eventName" },
    { name: "pageLocation" },
  ];
  if (puebloDimName) seriesDimensions.push({ name: puebloDimName });
  if (categoriaDimName) seriesDimensions.push({ name: categoriaDimName });

  const reqSeries: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [
      { startDate: axis.queryRange.start, endDate: axis.queryRange.end },
    ],
    metrics: [
      { name: "screenPageViews" }, // Usamos pageViews como métrica principal
    ],
    dimensions: seriesDimensions,
    dimensionFilter: {
      andGroup: { expressions: seriesFilters },
    },
    keepEmptyRows: false,
    limit: "200000",
  };

  const seriesResp = await analyticsData.properties.runReport({
    property,
    requestBody: reqSeries,
  });

  const rows: analyticsdata_v1beta.Schema$Row[] = seriesResp.data.rows ?? [];

  // Vectores current/previous
  const currViews: number[] = Array<number>(N).fill(0);
  const prevViews: number[] = Array<number>(N).fill(0);

  // Como GA4 ya filtró por pageLocation exacta, solo procesamos los datos
  for (const r of rows) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];

    // Las dimensiones están en orden: [time, eventName, pageLocation, pueblo?, categoria?]
    const slotRaw = String(dims[0]?.value ?? "");
    const vws = Number(mets[0]?.value ?? 0);

    let slotKey: string | null = null;
    if (axis.dimensionTime === "date") {
      // YYYYMMDD -> YYYY-MM-DD
      if (slotRaw.length === 8) {
        slotKey = `${slotRaw.slice(0, 4)}-${slotRaw.slice(
          4,
          6
        )}-${slotRaw.slice(6, 8)}`;
      }
    } else {
      // "yearMonth" → YYYYMM
      if (slotRaw.length === 6) slotKey = slotRaw;
    }
    if (!slotKey) continue;

    const iCur = axis.curIndexByKey.get(slotKey);
    const iPrev = axis.prevIndexByKey.get(slotKey);

    if (iCur !== undefined) {
      currViews[iCur] += vws;
    }
    if (iPrev !== undefined) {
      prevViews[iPrev] += vws;
    }
  }

  const series = {
    current: axis.xLabels.map((label: string, i: number) => ({
      label,
      value: currViews[i] ?? 0,
    })),
    previous: axis.xLabels.map((label: string, i: number) => ({
      label,
      value: prevViews[i] ?? 0,
    })),
  };

  return series;
}

/* ---------- handler ---------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Obtener parámetros como en la API original
    const g = (url.searchParams.get("granularity") || "d") as Granularity;
    const endISOParam = url.searchParams.get("end") || undefined;

    // Obtener múltiples URLs para series
    const includeSeriesFor = url.searchParams.getAll("includeSeriesFor");

    if (includeSeriesFor.length === 0) {
      return NextResponse.json({
        series: [],
        message: "No URLs provided for series data",
      });
    }

    // Si no viene endISO, usar AYER (UTC) como límite
    const endISO =
      endISOParam ??
      (() => {
        const y = addDaysUTC(todayUTC(), -1);
        const yyyy = y.getUTCFullYear();
        const mm = String(y.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(y.getUTCDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })();

    // Construir axis usando el mismo patrón que drilldown/url
    const axis: AxisLagged = buildLaggedAxisForGranularity(g, { endISO });

    // ===== GA =====
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // ===== Obtener dimensiones customizadas una vez =====
    const dimsAvailable = await fetchDimensionApiNames(
      analyticsData,
      property.replace("properties/", "")
    );

    // ===== Construir URLs completas para GA4 =====
    const BASE_URL = "https://wp.ideanto.com";

    // ===== Procesar todas las URLs en paralelo =====
    const seriesPromises = includeSeriesFor.map((path) => {
      // Construir URL completa: GA4 almacena URLs completas, no paths relativos
      const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path}`;

      return fetchUrlSeries(
        analyticsData,
        property,
        axis,
        fullUrl,
        dimsAvailable
      )
        .then((seriesData) => ({
          path: path, // Devolver el path original para el frontend
          data: seriesData.current, // Solo devolvemos current para el chart
        }))
        .catch((error) => {
          console.error(`❌ ERROR PROCESSING ${path}:`, error);
          return {
            path: path,
            data: [], // Serie vacía en caso de error
          };
        });
    });

    const series = await Promise.all(seriesPromises);

    return NextResponse.json({
      series,
      granularity: g,
      range: {
        current: axis.curRange,
        previous: axis.prevRange,
      },
      xLabels: axis.xLabels,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[top-comparative-pages-fixed] ERROR =", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
