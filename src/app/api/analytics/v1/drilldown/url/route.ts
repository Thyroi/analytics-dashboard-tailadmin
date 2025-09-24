import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import type { Granularity, DonutDatum, SeriesPoint } from "@/lib/types";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  deriveAutoRangeForGranularity,
  parseISO,
  prevComparable,
  todayUTC,
} from "@/lib/utils/datetime";
import { normalizePath, stripLangPrefix, safePathname } from "@/lib/utils/url";
import { groupFromDailyMaps } from "@/lib/utils/charts";

/* ---------- helpers ---------- */
type DateRange = { start: string; end: string };

function toISODate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function eqPath(a: string, b: string): boolean {
  const na = stripLangPrefix(normalizePath(a)).path.replace(/\/+$/, "") || "/";
  const nb = stripLangPrefix(normalizePath(b)).path.replace(/\/+$/, "") || "/";
  return na === nb;
}

/** divide series (num/den) bucket a bucket */
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
  averageSessionDuration: number; // seconds
};

function num(v?: string | null) {
  return Number(v ?? 0);
}

async function fetchUrlTotals(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  property: string,
  range: DateRange,
  targetPath: string
): Promise<Totals> {
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
    // Filtrado por pageLocation (URL exacta). No hace falta incluir la dimensión.
    dimensionFilter: {
      filter: {
        fieldName: "pageLocation",
        stringFilter: { matchType: "EXACT", value: targetPath, caseSensitive: false },
      },
    },
    keepEmptyRows: false,
    limit: "1",
  };

  const resp = await analyticsData.properties.runReport({ property, requestBody: req });
  const m = resp.data.rows?.[0]?.metricValues ?? [];
  return {
    activeUsers: num(m[0]?.value),
    userEngagementDuration: num(m[1]?.value),
    newUsers: num(m[2]?.value),
    eventCount: num(m[3]?.value),
    sessions: num(m[4]?.value),
    averageSessionDuration: num(m[5]?.value),
  };
}

/* ---------- handler ---------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawPath = url.searchParams.get("path") || ""; // URL o pathname
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    if (!rawPath) {
      return NextResponse.json({ error: "Missing 'path' query param" }, { status: 400 });
    }

    // normaliza el objetivo
    const targetPath = safePathname(rawPath);

    // rangos
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveAutoRangeForGranularity(g, now);
    const prevPreset = prevComparable(currPreset);
    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // GA
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    /* -------- 1) Serie diaria: engagementDuration + views por pageLocation -------- */
    const reqSeries: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.previous.start, endDate: ranges.current.end }],
      metrics: [{ name: "userEngagementDuration" }, { name: "screenPageViews" }],
      dimensions: [{ name: "date" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
        },
      },
      keepEmptyRows: false,
      limit: "200000",
    };

    const seriesResp = await analyticsData.properties.runReport({
      property,
      requestBody: reqSeries,
    });

    const rows = seriesResp.data.rows ?? [];

    // Acumuladores diarios para la URL seleccionada
    const currEng = new Map<string, number>();
    const prevEng = new Map<string, number>();
    const currViews = new Map<string, number>();
    const prevViews = new Map<string, number>();

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const dRaw = String(dims[0]?.value ?? "");
      if (dRaw.length !== 8) continue;
      const iso = toISODate(dRaw);

      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;

      // sólo la URL exacta (ignorando slash final/lang)
      if (!eqPath(onlyPath, targetPath)) continue;

      const eng = Number(mets[0]?.value ?? 0); // segundos totales
      const vws = Number(mets[1]?.value ?? 0);

      const inCurrent = iso >= ranges.current.start && iso <= ranges.current.end;
      const inPrevious = iso >= ranges.previous.start && iso <= ranges.previous.end;

      if (inCurrent) {
        currEng.set(iso, (currEng.get(iso) ?? 0) + eng);
        currViews.set(iso, (currViews.get(iso) ?? 0) + vws);
      } else if (inPrevious) {
        prevEng.set(iso, (prevEng.get(iso) ?? 0) + eng);
        prevViews.set(iso, (prevViews.get(iso) ?? 0) + vws);
      }
    }

    // Agrupamos por granularidad usando el helper común
    const { series: seriesEng } = groupFromDailyMaps(g, ranges, currEng, prevEng);
    const { series: seriesVws, totals } = groupFromDailyMaps(g, ranges, currViews, prevViews);

    const seriesAvg = ratioSeries(seriesEng, seriesVws); // segundos promedio por bucket
    const deltaPct = pctDelta(totals.current, totals.previous); // delta de VIEWS (referencia)

    /* -------- 1.b) KPIs totales por URL (current / previous) -------- */
    const [totCurr, totPrev] = await Promise.all([
      fetchUrlTotals(analyticsData, property, ranges.current, targetPath),
      fetchUrlTotals(analyticsData, property, ranges.previous, targetPath),
    ]);

    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

    const kpisCurrent = {
      ...totCurr,
      avgEngagementPerUser: safeDiv(totCurr.userEngagementDuration, totCurr.activeUsers),
      eventsPerSession: safeDiv(totCurr.eventCount, totCurr.sessions),
    };
    const kpisPrevious = {
      ...totPrev,
      avgEngagementPerUser: safeDiv(totPrev.userEngagementDuration, totPrev.activeUsers),
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

    /* -------- 2) Donut operating systems (operatingSystem) — sólo rango current -------- */
    const reqOS: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.current.start, endDate: ranges.current.end }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "operatingSystem" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "eventName",
                stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
              },
            },
          ],
        },
      },
      keepEmptyRows: false,
      limit: "100000",
    };

    const osResp = await analyticsData.properties.runReport({ property, requestBody: reqOS });
    const osRows = osResp.data.rows ?? [];
    const osMap = new Map<string, number>();
    for (const r of osRows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;
      if (!eqPath(onlyPath, targetPath)) continue;
      const raw = String(dims[0]?.value ?? "Unknown");
      const os = raw.trim().length > 0 ? raw : "Unknown";
      const val = Number(mets[0]?.value ?? 0);
      osMap.set(os, (osMap.get(os) ?? 0) + val);
    }
    const operatingSystems: DonutDatum[] = Array.from(osMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    /* -------- 3) Donut genders (userGender) — sólo rango current -------- */
    const reqGender: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.current.start, endDate: ranges.current.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "userGender" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "eventName",
                stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
              },
            },
          ],
        },
      },
      keepEmptyRows: false,
      limit: "100000",
    };

    const genResp = await analyticsData.properties.runReport({ property, requestBody: reqGender });
    const genRows = genResp.data.rows ?? [];
    thead: ;
    const genMap = new Map<string, number>();
    for (const r of genRows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;
      if (!eqPath(onlyPath, targetPath)) continue;
      const gnd = String(dims[0]?.value ?? "unknown").toLowerCase();
      const val = Number(mets[0]?.value ?? 0);
      genMap.set(gnd, (genMap.get(gnd) ?? 0) + val);
    }
    const genders: DonutDatum[] = Array.from(genMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    /* -------- 4) Donut countries (country) — sólo rango current -------- */
    const reqCountry: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.current.start, endDate: ranges.current.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "country" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "eventName",
                stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
              },
            },
          ],
        },
      },
      keepEmptyRows: false,
      limit: "100000",
    };

    const ctyResp = await analyticsData.properties.runReport({ property, requestBody: reqCountry });
    const ctyRows = ctyResp.data.rows ?? [];
    const ctyMap = new Map<string, number>();
    for (const r of ctyRows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;
      if (!eqPath(onlyPath, targetPath)) continue;
      const ctry = String(dims[0]?.value ?? "Unknown");
      const val = Number(mets[0]?.value ?? 0);
      ctyMap.set(ctry, (ctyMap.get(ctry) ?? 0) + val);
    }
    const countries: DonutDatum[] = Array.from(ctyMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        context: { path: targetPath },
        seriesAvgEngagement: seriesAvg, // segundos
        kpis: {
          current: kpisCurrent,
          previous: kpisPrevious,
          deltaPct: kpisDeltaPct,
        },
        operatingSystems,
        genders,
        countries,
        deltaPct, // respecto a vistas (referencia)
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
