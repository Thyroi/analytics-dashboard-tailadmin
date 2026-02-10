// src/app/api/analytics/v1/drilldown/url/route.ts
import type { Granularity, SeriesPoint } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { runReportLimited } from "@/lib/utils/analytics/ga4RateLimit";
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

// Shared modules
import {
  pctDelta,
  ratioSeries,
  safeDiv,
} from "@/lib/analytics/drilldown/helpers";
import {
  fetchDonutData,
  fetchUrlTotalsAggregated,
} from "@/lib/analytics/ga4/urlDrilldown";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
        { status: 400 },
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
        g,
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

    // Construir dimensiones para series: tiempo + pageLocation + eventName
    const seriesDimensions: analyticsdata_v1beta.Schema$Dimension[] = [
      { name: axis.dimensionTime }, // "date" | "yearMonth"
      { name: "eventName" },
      { name: "pageLocation" },
    ];

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

    const seriesResp = await runReportLimited(analyticsData, {
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

      // Las dimensiones están en orden: [time, eventName, pageLocation]
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
    const totCurr = await fetchUrlTotalsAggregated(
      analyticsData,
      property,
      axis.curRange,
      targetUrl,
    );
    const totPrev = await fetchUrlTotalsAggregated(
      analyticsData,
      property,
      axis.prevRange,
      targetUrl,
    );

    const kpisCurrent = {
      ...totCurr,
      avgEngagementPerUser: safeDiv(
        totCurr.userEngagementDuration,
        totCurr.activeUsers,
      ),
      eventsPerSession: safeDiv(totCurr.eventCount, totCurr.sessions),
    };
    const kpisPrevious = {
      ...totPrev,
      avgEngagementPerUser: safeDiv(
        totPrev.userEngagementDuration,
        totPrev.activeUsers,
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
        totPrev.averageSessionDuration,
      ),
      avgEngagementPerUser: pctDelta(
        kpisCurrent.avgEngagementPerUser,
        kpisPrevious.avgEngagementPerUser,
      ),
      eventsPerSession: pctDelta(
        kpisCurrent.eventsPerSession,
        kpisPrevious.eventsPerSession,
      ),
    };

    // ===== Donuts (current) — usando módulo compartido =====
    const operatingSystems = await fetchDonutData(
      analyticsData,
      property,
      donutRange,
      targetUrl,
      "operatingSystem",
      "screenPageViews",
    );
    const devices = await fetchDonutData(
      analyticsData,
      property,
      donutRange,
      targetUrl,
      "deviceCategory",
      "activeUsers",
    );
    const countries = await fetchDonutData(
      analyticsData,
      property,
      donutRange,
      targetUrl,
      "country",
      "activeUsers",
    );

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
      { status: 200 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[url-drilldown] ERROR =", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
