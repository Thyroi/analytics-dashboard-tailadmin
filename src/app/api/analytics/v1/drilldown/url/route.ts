import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import {
  deriveRangeEndingYesterday,
  parseISO,
  prevComparable,
  todayUTC,
} from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { buildAxisForGranularity } from "@/lib/utils/timeAxis";
import { normalizePath, safePathname, stripLangPrefix } from "@/lib/utils/url";
import type { GoogleAuth } from "google-auth-library";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

/* ---------- helpers ---------- */
type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function eqPath(a: string, b: string): boolean {
  const na = stripLangPrefix(normalizePath(a)).path.replace(/\/+$/, "") || "/";
  const nb = stripLangPrefix(normalizePath(b)).path.replace(/\/+$/, "") || "/";
  return na === nb;
}

/* promedio bucket a bucket: num/den */
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

function num(v?: string | null) {
  return Number(v ?? 0);
}

/** KPIs totales por URL (filtrando pageLocation en el código con eqPath) */
async function fetchUrlTotalsAggregated(
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
    dimensions: [{ name: "pageLocation" }, { name: "eventName" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: "page_view",
          caseSensitive: false,
        },
      },
    },
    keepEmptyRows: false,
    limit: "100000",
  };

  const resp = await analyticsData.properties.runReport({
    property,
    requestBody: req,
  });
  const rows = resp.data.rows ?? [];

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

  for (const r of rows) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];
    const loc = String(dims[0]?.value ?? "");
    const onlyPath = stripLangPrefix(normalizePath(loc)).path;

    if (!eqPath(onlyPath, targetPath)) continue;

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
    const rawPath = url.searchParams.get("path") || ""; // URL o pathname
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    if (!rawPath) {
      return NextResponse.json(
        { error: "Missing 'path' query param" },
        { status: 400 }
      );
    }

    const targetPath = safePathname(rawPath);

    // rangos (terminando AYER) — para 'd' queremos 7 días
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveRangeEndingYesterday(g, now, g === "d");
    const prevPreset = prevComparable(currPreset);
    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // EJE / BUCKETS
    const axis = buildAxisForGranularity(g, ranges);
    const N = axis.xLabels.length;

    // GA
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    /* -------- Serie por bucket: engagement (seg) y vistas -------- */
    const reqSeries: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [
        { startDate: ranges.previous.start, endDate: ranges.current.end },
      ],
      metrics: [
        { name: "userEngagementDuration" },
        { name: "screenPageViews" },
      ],
      dimensions: [
        { name: axis.dimensionTime },
        { name: "pageLocation" },
        { name: "eventName" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "page_view",
            caseSensitive: false,
          },
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

    // Vectores current/previous
    const currEng = Array(N).fill(0) as number[];
    const prevEng = Array(N).fill(0) as number[];
    const currViews = Array(N).fill(0) as number[];
    const prevViews = Array(N).fill(0) as number[];

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const slotRaw = String(dims[0]?.value ?? "");
      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;
      if (!eqPath(onlyPath, targetPath)) continue;

      const eng = Number(mets[0]?.value ?? 0);
      const vws = Number(mets[1]?.value ?? 0);

      // key del slot
      let slotKey: string | null = null;
      if (axis.dimensionTime === "date") {
        if (slotRaw.length === 8) {
          slotKey = `${slotRaw.slice(0, 4)}-${slotRaw.slice(
            4,
            6
          )}-${slotRaw.slice(6, 8)}`;
        }
      } else {
        if (slotRaw.length === 6) slotKey = slotRaw; // YYYYMM
      }
      if (!slotKey) continue;

      const iCur = axis.indexByCurKey.get(slotKey);
      const iPrev = axis.indexByPrevKey.get(slotKey);

      if (iCur !== undefined) {
        currEng[iCur] += eng;
        currViews[iCur] += vws;
      } else if (iPrev !== undefined) {
        prevEng[iPrev] += eng;
        prevViews[iPrev] += vws;
      }
    }

    // to SeriesPoint
    const seriesEng: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label, i) => ({
        label,
        value: currEng[i] ?? 0,
      })),
      previous: axis.xLabels.map((label, i) => ({
        label,
        value: prevEng[i] ?? 0,
      })),
    };
    const seriesVws: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label, i) => ({
        label,
        value: currViews[i] ?? 0,
      })),
      previous: axis.xLabels.map((label, i) => ({
        label,
        value: prevViews[i] ?? 0,
      })),
    };

    const totals = {
      current: currViews.reduce((a, b) => a + b, 0),
      previous: prevViews.reduce((a, b) => a + b, 0),
    };

    const seriesAvg = ratioSeries(seriesEng, seriesVws); // segundos avg por bucket
    const deltaPct = pctDelta(totals.current, totals.previous); // respecto a vistas

    /* -------- 1.b) KPIs totales (current / previous) -------- */
    const [totCurr, totPrev] = await Promise.all([
      fetchUrlTotalsAggregated(
        analyticsData,
        property,
        ranges.current,
        targetPath
      ),
      fetchUrlTotalsAggregated(
        analyticsData,
        property,
        ranges.previous,
        targetPath
      ),
    ]);

    const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
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

    /* -------- 2-4) Donuts (current) -------- */
    const donutFor = async (
      dim: "operatingSystem" | "userGender" | "country",
      metric: "screenPageViews" | "activeUsers"
    ): Promise<DonutDatum[]> => {
      const req: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [
          { startDate: ranges.current.start, endDate: ranges.current.end },
        ],
        metrics: [{ name: metric }],
        dimensions: [
          { name: dim },
          { name: "pageLocation" },
          { name: "eventName" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: {
              matchType: "EXACT",
              value: "page_view",
              caseSensitive: false,
            },
          },
        },
        keepEmptyRows: false,
        limit: "100000",
      };
      const r = await analyticsData.properties.runReport({
        property,
        requestBody: req,
      });
      const rows = r.data.rows ?? [];
      const map = new Map<string, number>();
      for (const row of rows) {
        const dims = row.dimensionValues ?? [];
        const mets = row.metricValues ?? [];
        const loc = String(dims[1]?.value ?? "");
        const onlyPath = stripLangPrefix(normalizePath(loc)).path;
        if (!eqPath(onlyPath, targetPath)) continue;
        const raw = String(dims[0]?.value ?? "Unknown").trim();
        const label = raw.length > 0 ? raw : "Unknown";
        const val = Number(mets[0]?.value ?? 0);
        map.set(label, (map.get(label) ?? 0) + val);
      }
      return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    };

    const [operatingSystems, genders, countries] = await Promise.all([
      donutFor("operatingSystem", "screenPageViews"),
      donutFor("userGender", "activeUsers"),
      donutFor("country", "activeUsers"),
    ]);

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
