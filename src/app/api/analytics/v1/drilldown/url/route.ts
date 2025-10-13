// src/app/api/analytics/v1/drilldown/url/route.ts
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { addDaysUTC, todayUTC } from "@/lib/utils/time/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { buildLaggedAxisForGranularity } from "@/lib/utils/time/timeAxis";
import { normalizePath, safePathname, stripLangPrefix } from "@/lib/utils/routing/url";
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

function eqPath(a: string, b: string): boolean {
  const na = stripLangPrefix(normalizePath(a)).path.replace(/\/+$/, "") || "/";
  const nb = stripLangPrefix(normalizePath(b)).path.replace(/\/+$/, "") || "/";
  return na === nb;
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
    const endISOParam = url.searchParams.get("end") || undefined;

    if (!rawPath) {
      return NextResponse.json(
        { error: "Missing 'path' query param" },
        { status: 400 }
      );
    }

    const targetPath = safePathname(rawPath);

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

    // ===== EJE / BUCKETS (ventanas “lagged” solapadas) =====
    // d/w → 7 días (prev = esos 7 días -1 día)
    // m   → 30 días (prev = 30 días -1 día)
    // y   → 12 meses (prev = 12 meses -1 mes), alineados por índice
    const axis = buildLaggedAxisForGranularity(g, { endISO });
    const N = axis.xLabels.length;

    // ===== GA =====
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // ===== Serie por bucket: engagement (seg) y vistas =====
    const reqSeries: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [
        { startDate: axis.queryRange.start, endDate: axis.queryRange.end },
      ],
      metrics: [
        { name: "userEngagementDuration" },
        { name: "screenPageViews" },
      ],
      dimensions: [
        { name: axis.dimensionTime }, // "date" | "yearMonth"
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

    const rows: analyticsdata_v1beta.Schema$Row[] = seriesResp.data.rows ?? [];

    // Vectores current/previous
    const currEng: number[] = Array<number>(N).fill(0);
    const prevEng: number[] = Array<number>(N).fill(0);
    const currViews: number[] = Array<number>(N).fill(0);
    const prevViews: number[] = Array<number>(N).fill(0);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const slotRaw = String(dims[0]?.value ?? "");
      const loc = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(loc)).path;
      if (!eqPath(onlyPath, targetPath)) continue;

      const eng = Number(mets[0]?.value ?? 0);
      const vws = Number(mets[1]?.value ?? 0);

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
      fetchUrlTotalsAggregated(analyticsData, property, axis.curRange, targetPath),
      fetchUrlTotalsAggregated(analyticsData, property, axis.prevRange, targetPath),
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

    // ===== Donuts (current) — ejemplo: por SO, género y país =====
    async function donutFor(
      dim: "operatingSystem" | "userGender" | "country",
      metric: "screenPageViews" | "activeUsers"
    ): Promise<DonutDatum[]> {
      const req: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [{ startDate: axis.curRange.start, endDate: axis.curRange.end }],
        metrics: [{ name: metric }],
        dimensions: [{ name: dim }, { name: "pageLocation" }, { name: "eventName" }],
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

      const r = await analyticsData.properties.runReport({ property, requestBody: req });
      const rowsDonut: analyticsdata_v1beta.Schema$Row[] = r.data.rows ?? [];
      const map = new Map<string, number>();

      for (const row of rowsDonut) {
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
    }

    const [operatingSystems, genders, countries] = await Promise.all([
      donutFor("operatingSystem", "screenPageViews"),
      donutFor("userGender", "activeUsers"),
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
