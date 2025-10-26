// src/app/api/analytics/v1/drilldown/url/route.ts
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { safePathname } from "@/lib/utils/routing/url";
import {
  calculatePreviousRangeForAxis,
  generateLabelsForRange,
} from "@/lib/utils/time/axisHelpers";
import { addDaysUTC, todayUTC } from "@/lib/utils/time/datetime";
import { determineGA4Granularity } from "@/lib/utils/time/rangeCalculations";
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
type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/** promedio bucket a bucket: num/den */
function ratioSeries(
  num: { current: SeriesPoint[]; previous: SeriesPoint[] },
  den: { current: SeriesPoint[]; previous: SeriesPoint[] }
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  const div = (A: SeriesPoint[], B: SeriesPoint[]) =>
    A.map((p, i) => {
      const d = B[i]?.value ?? 0;
      return { label: p.label, value: d > 0 ? p.value / d : 0 };
    });
  return {
    current: div(num.current, den.current),
    previous: div(num.previous, den.previous),
  };
}

type Totals = {
  activeUsers: number;
  userEngagementDuration: number; // seconds
  newUsers: number;
  eventCount: number;
  sessions: number;
  averageSessionDuration: number; // seconds (ponderado)
};

function num(v?: string | null): number {
  return Number(v ?? 0);
}

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

/** KPIs totales por URL (usando filtro directo de GA4 por pageLocation) */
async function fetchUrlTotalsAggregated(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  property: string,
  range: DateRange,
  targetUrl: string
): Promise<Totals> {
  // Obtener dimensiones customizadas disponibles
  const dimsAvailable = await fetchDimensionApiNames(
    analyticsData,
    property.replace("properties/", "")
  );
  const puebloDimName = resolveCustomEventDim(dimsAvailable, "pueblo");
  const categoriaDimName = resolveCustomEventDim(dimsAvailable, "categoria");

  // Construir dimensiones: siempre eventName y pageLocation, más las customizadas si están disponibles
  const dimensions: analyticsdata_v1beta.Schema$Dimension[] = [
    { name: "eventName" },
    { name: "pageLocation" },
  ];
  if (puebloDimName) dimensions.push({ name: puebloDimName });
  if (categoriaDimName) dimensions.push({ name: categoriaDimName });

  // Usar filtros AND para eventName Y pageLocation
  const filters: analyticsdata_v1beta.Schema$FilterExpression[] = [
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

  const req: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [
      { name: "activeUsers" },
      { name: "userEngagementDuration" },
      { name: "newUsers" },
      { name: "eventCount" },
      { name: "sessions" },
      { name: "averageSessionDuration" },
    ],
    dimensions,
    dimensionFilter: {
      andGroup: { expressions: filters },
    },
    keepEmptyRows: false,
    limit: "100000",
  };

  const resp = await analyticsData.properties.runReport({
    property,
    requestBody: req,
  });

  const rows: analyticsdata_v1beta.Schema$Row[] = resp.data.rows ?? [];

  const acc: Totals = {
    activeUsers: 0,
    userEngagementDuration: 0,
    newUsers: 0,
    eventCount: 0,
    sessions: 0,
    averageSessionDuration: 0,
  };

  let weightedSumAvgSess = 0;
  let sumSessions = 0;

  // Como GA4 ya filtró por pageLocation exacta, solo sumamos todos los resultados
  for (const r of rows) {
    const mets = r.metricValues ?? [];

    const activeUsers = num(mets[0]?.value);
    const userEngagementDuration = num(mets[1]?.value);
    const newUsers = num(mets[2]?.value);
    const eventCount = num(mets[3]?.value);
    const sessions = num(mets[4]?.value);
    const averageSessionDuration = num(mets[5]?.value);

    acc.activeUsers += activeUsers;
    acc.userEngagementDuration += userEngagementDuration;
    acc.newUsers += newUsers;
    acc.eventCount += eventCount;
    acc.sessions += sessions;

    weightedSumAvgSess += averageSessionDuration * sessions;
    sumSessions += sessions;
  }

  acc.averageSessionDuration =
    sumSessions > 0 ? weightedSumAvgSess / sumSessions : 0;

  return acc;
}

/* ---------- handler ---------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawPath = url.searchParams.get("path") || ""; // URL completa
    const g = (url.searchParams.get("granularity") || "d") as Granularity;
    const endISOParam = url.searchParams.get("endDate") || undefined;
    const startISOParam = url.searchParams.get("startDate") || undefined;

    if (!rawPath) {
      return NextResponse.json(
        { error: "Missing 'path' query param" },
        { status: 400 }
      );
    }

    // Usar la URL completa directamente, sin normalización
    const targetUrl = rawPath;
    const targetPath = safePathname(rawPath); // Solo para mostrar en context

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

    // ===== CONSTRUCCIÓN DEL AXIS CON FIX =====
    let axis: AxisLagged;
    if (startISOParam) {
      // ✅ FIX: Generar xLabels completos para custom range
      const customRange = { start: startISOParam, end: endISO };
      const ga4Granularity = determineGA4Granularity(g);

      // Generar labels completos según granularidad
      const xLabels = generateLabelsForRange(startISOParam, endISO, g);

      // Calcular previous range (ventana contigua del mismo tamaño)
      const prevRange = calculatePreviousRangeForAxis(customRange);
      const prevLabels = generateLabelsForRange(
        prevRange.start,
        prevRange.end,
        g
      );

      // Convertir labels a keys (sin guiones)
      const curKeys = xLabels.map((label) => label.replace(/-/g, ""));
      const prevKeys = prevLabels.map((label) => label.replace(/-/g, ""));

      axis = {
        dimensionTime: ga4Granularity === "y" ? "yearMonth" : "date",
        queryRange: { start: prevRange.start, end: customRange.end },
        curRange: customRange,
        prevRange: prevRange,
        xLabels: xLabels, // ✅ Array completo
        curKeys: curKeys, // ✅ Array completo
        prevKeys: prevKeys, // ✅ Array completo
        curIndexByKey: new Map(curKeys.map((k, i) => [k, i])),
        prevIndexByKey: new Map(prevKeys.map((k, i) => [k, i])),
      };
    } else {
      // ===== EJE / BUCKETS (ventanas "lagged" solapadas) =====
      // d/w → 7 días (prev = esos 7 días -1 día)
      // m   → 30 días (prev = 30 días -1 día)
      // y   → 12 meses (prev = 12 meses -1 mes), alineados por índice
      axis = buildLaggedAxisForGranularity(g, { endISO });

      // SOLO actualizar la dimensión de tiempo para GA4
      const ga4Granularity = determineGA4Granularity(g);
      axis.dimensionTime = ga4Granularity === "y" ? "yearMonth" : "date";
    }

    const N = axis.xLabels.length;

    // Crear rangos separados para donut (solo para granularidad diaria)
    const donutRange =
      g === "d"
        ? { start: axis.curRange.end, end: axis.curRange.end } // Solo último día
        : axis.curRange; // Rango completo para otras granularidades

    // ===== GA =====
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // ===== Obtener dimensiones customizadas una vez para toda la función =====
    const dimsAvailable = await fetchDimensionApiNames(
      analyticsData,
      property.replace("properties/", "")
    );
    const puebloDimName = resolveCustomEventDim(dimsAvailable, "pueblo");
    const categoriaDimName = resolveCustomEventDim(dimsAvailable, "categoria");

    // ===== Serie por bucket: engagement (seg) y vistas =====
    // Usar filtros AND para eventName Y pageLocation como en KPIs
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
        { name: "userEngagementDuration" },
        { name: "screenPageViews" },
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
    const currEng: number[] = Array<number>(N).fill(0);
    const prevEng: number[] = Array<number>(N).fill(0);
    const currViews: number[] = Array<number>(N).fill(0);
    const prevViews: number[] = Array<number>(N).fill(0);

    // Como GA4 ya filtró por pageLocation exacta, solo procesamos los datos
    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      // Las dimensiones están en orden: [time, eventName, pageLocation, pueblo?, categoria?]
      const slotRaw = String(dims[0]?.value ?? "");

      const eng = Number(mets[0]?.value ?? 0);
      const vws = Number(mets[1]?.value ?? 0);

      let slotKey: string | null = null;
      if (axis.dimensionTime === "date") {
        // YYYYMMDD -> YYYYMMDD (sin guiones para matching)
        if (slotRaw.length === 8) {
          slotKey = slotRaw; // Mantener sin guiones
        }
      } else {
        // "yearMonth" → YYYYMM
        if (slotRaw.length === 6) slotKey = slotRaw;
      }
      if (!slotKey) continue;

      const iCur = axis.curIndexByKey.get(slotKey);
      const iPrev = axis.prevIndexByKey.get(slotKey);

      if (iCur !== undefined) {
        currEng[iCur] += eng;
        currViews[iCur] += vws;
      }
      if (iPrev !== undefined) {
        prevEng[iPrev] += eng;
        prevViews[iPrev] += vws;
      }
    }

    const seriesEng: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label: string, i: number) => ({
        label,
        value: currEng[i] ?? 0,
      })),
      previous: axis.xLabels.map((label: string, i: number) => ({
        label,
        value: prevEng[i] ?? 0,
      })),
    };
    const seriesVws: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label: string, i: number) => ({
        label,
        value: currViews[i] ?? 0,
      })),
      previous: axis.xLabels.map((label: string, i: number) => ({
        label,
        value: prevViews[i] ?? 0,
      })),
    };

    const totals = {
      current: currViews.reduce((a, b) => a + b, 0),
      previous: prevViews.reduce((a, b) => a + b, 0),
    };

    const seriesAvg = ratioSeries(seriesEng, seriesVws); // segundos promedio por bucket
    const deltaPct = pctDelta(totals.current, totals.previous); // ref: vistas

    // ===== KPIs (current / previous) =====
    const [totCurr, totPrev] = await Promise.all([
      fetchUrlTotalsAggregated(
        analyticsData,
        property,
        axis.curRange,
        targetUrl
      ),
      fetchUrlTotalsAggregated(
        analyticsData,
        property,
        axis.prevRange,
        targetUrl
      ),
    ]);

    const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);
    const kpisCurrent = {
      ...totCurr,
      avgEngagementPerUser: safeDiv(
        totCurr.userEngagementDuration,
        totCurr.activeUsers
      ),
      eventsPerSession: safeDiv(totCurr.eventCount, totCurr.sessions),
    };
    const kpisPrevious = {
      ...totPrev,
      avgEngagementPerUser: safeDiv(
        totPrev.userEngagementDuration,
        totPrev.activeUsers
      ),
      eventsPerSession: safeDiv(totPrev.eventCount, totPrev.sessions),
    };
    const kpisDeltaPct = {
      activeUsers: pctDelta(totCurr.activeUsers, totPrev.activeUsers),
      newUsers: pctDelta(totCurr.newUsers, totPrev.newUsers),
      eventCount: pctDelta(totCurr.eventCount, totPrev.eventCount),
      sessions: pctDelta(totCurr.sessions, totPrev.sessions),
      averageSessionDuration: pctDelta(
        totCurr.averageSessionDuration,
        totPrev.averageSessionDuration
      ),
      avgEngagementPerUser: pctDelta(
        kpisCurrent.avgEngagementPerUser,
        kpisPrevious.avgEngagementPerUser
      ),
      eventsPerSession: pctDelta(
        kpisCurrent.eventsPerSession,
        kpisPrevious.eventsPerSession
      ),
    };

    // ===== Donuts (current) — usando filtrado directo como los KPIs =====
    async function donutFor(
      dim: "operatingSystem" | "deviceCategory" | "browser" | "country",
      metric: "screenPageViews" | "activeUsers"
    ): Promise<DonutDatum[]> {
      // Construir dimensiones para donuts: target + eventName + pageLocation + customs
      const donutDimensions: analyticsdata_v1beta.Schema$Dimension[] = [
        { name: dim },
        { name: "eventName" },
        { name: "pageLocation" },
      ];
      if (puebloDimName) donutDimensions.push({ name: puebloDimName });
      if (categoriaDimName) donutDimensions.push({ name: categoriaDimName });

      // Usar filtros AND como en KPIs: eventName Y pageLocation
      const donutFilters: analyticsdata_v1beta.Schema$FilterExpression[] = [
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

      const req: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [{ startDate: donutRange.start, endDate: donutRange.end }],
        metrics: [{ name: metric }],
        dimensions: donutDimensions,
        dimensionFilter: {
          andGroup: { expressions: donutFilters },
        },
        keepEmptyRows: false,
        limit: "100000",
      };

      const r = await analyticsData.properties.runReport({
        property,
        requestBody: req,
      });
      const rowsDonut: analyticsdata_v1beta.Schema$Row[] = r.data.rows ?? [];
      const map = new Map<string, number>();

      // Como GA4 ya filtró por URL exacta, solo sumamos todos los resultados
      for (const row of rowsDonut) {
        const dims = row.dimensionValues ?? [];
        const mets = row.metricValues ?? [];

        // Las dimensiones están en orden: [targetDim, eventName, pageLocation, pueblo?, categoria?]
        const raw = String(dims[0]?.value ?? "Unknown").trim();
        const label = raw.length > 0 ? raw : "Unknown";
        const val = Number(mets[0]?.value ?? 0);
        map.set(label, (map.get(label) ?? 0) + val);
      }

      return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    }

    const [operatingSystems, devices, countries] = await Promise.all([
      donutFor("operatingSystem", "screenPageViews"),
      donutFor("deviceCategory", "activeUsers"),
      donutFor("country", "activeUsers"),
    ]);

    return NextResponse.json(
      {
        granularity: g,
        range: { current: axis.curRange, previous: axis.prevRange },
        context: { path: targetPath },
        xLabels: axis.xLabels,
        seriesAvgEngagement: seriesAvg,
        kpis: {
          current: kpisCurrent,
          previous: kpisPrevious,
          deltaPct: kpisDeltaPct,
        },
        operatingSystems,
        devices,
        countries,
        deltaPct,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[url-drilldown] ERROR =", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
