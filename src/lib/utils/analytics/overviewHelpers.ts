/**
 * Helpers específicos para la ruta overview
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import {
  addDaysUTC,
  parseISO,
  toISO,
  todayUTC,
} from "@/lib/utils/time/datetime";
import { buildLaggedAxisForGranularity } from "@/lib/utils/time/timeAxis";
import { analyticsdata_v1beta, google } from "googleapis";

/* ================= Tipos ================= */
export type Point = { label: string; value: number };
export type Range = { start: string; end: string };

export type OverviewResponse = {
  meta: {
    range: { current: Range; previous: Range };
    granularity: Granularity;
    timezone: "UTC";
    source: "wpideanto";
    property: string;
  };
  totals: {
    users: number;
    usersPrev: number;
    interactions: number;
    interactionsPrev: number;
  };
  series: {
    usersByBucket: Point[];
    usersByBucketPrev: Point[];
    interactionsByBucket: Point[];
    interactionsByBucketPrev: Point[];
  };
};

/* ================= Helpers ================= */
function yesterdayISO(): string {
  const y = addDaysUTC(todayUTC(), -1);
  return toISO(y);
}

function minusOneDayISO(iso: string): string {
  return toISO(addDaysUTC(parseISO(iso), -1));
}

function plusOneDayISO(iso: string): string {
  return toISO(addDaysUTC(parseISO(iso), 1));
}

function daysInMonthOf(iso: string): number {
  const d = parseISO(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const last = new Date(Date.UTC(y, m + 1, 0));
  return last.getUTCDate();
}

function listDatesISO(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cur = parseISO(startISO);
  const end = parseISO(endISO);
  while (cur.getTime() <= end.getTime()) {
    out.push(toISO(cur));
    cur = addDaysUTC(cur, 1);
  }
  return out;
}

function addMonthsISO(iso: string, delta: number): string {
  const d = parseISO(iso);
  const d2 = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, d.getUTCDate())
  );
  return toISO(d2);
}

function firstDayOfMonthISO(anchorISO: string, monthsBack: number): string {
  const d = parseISO(anchorISO);
  const d2 = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsBack, 1)
  );
  return toISO(d2);
}

function lastDayOfMonthISO(anchorISO: string): string {
  const d = parseISO(anchorISO);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return toISO(last);
}

function listLast12YearMonthKeys(endISO: string): string[] {
  const end = parseISO(endISO);
  const out: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1)
    );
    out.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  return out;
}

function plusOneMonthYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  const d2 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return `${d2.getUTCFullYear()}-${String(d2.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

/* ================= Query Principal ================= */
export async function queryOverview(
  granularity: Granularity,
  endISO?: string
): Promise<OverviewResponse> {
  const gParam = granularity.toLowerCase() as Granularity;
  const finalEndISO = endISO || yesterdayISO();

  // Config por granularidad
  type DimName = "date" | "yearMonth";
  let dimensionTime: DimName;
  let curRange: Range;
  let prevRange: Range;
  let dictKeys: string[];
  let outLabels: string[];

  if (gParam === "m") {
    // MES: buckets DIARIOS del MES de endISO
    dimensionTime = "date";
    const nDays = daysInMonthOf(finalEndISO);
    const startCur = toISO(addDaysUTC(parseISO(finalEndISO), -(nDays - 1)));
    curRange = { start: startCur, end: finalEndISO };
    prevRange = {
      start: minusOneDayISO(startCur),
      end: minusOneDayISO(finalEndISO),
    };
    dictKeys = listDatesISO(curRange.start, curRange.end);
    outLabels = dictKeys.map((k) => k.slice(8, 10)); // "DD"
  } else if (gParam === "y") {
    // AÑO: 12 buckets MENSUALES
    dimensionTime = "yearMonth";
    const curStart = firstDayOfMonthISO(finalEndISO, 11);
    curRange = { start: curStart, end: finalEndISO };
    const prevStart = firstDayOfMonthISO(finalEndISO, 12);
    const prevEnd = lastDayOfMonthISO(addMonthsISO(finalEndISO, -1));
    prevRange = { start: prevStart, end: prevEnd };
    dictKeys = listLast12YearMonthKeys(finalEndISO);
    outLabels = dictKeys.map((k) => k.slice(5, 7)); // "MM"
  } else {
    // D / W: eje diario + previous desfase -1 día
    const axis = buildLaggedAxisForGranularity(gParam, { endISO: finalEndISO });
    curRange = axis.curRange as Range;
    prevRange = {
      start: minusOneDayISO(curRange.start),
      end: minusOneDayISO(curRange.end),
    };
    dictKeys = axis.xLabels as string[];
    dimensionTime = "date";
    outLabels = dictKeys;
  }

  // GA
  const auth = getAuth();
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // Normalizar claves
  const normKey = (raw: string) => {
    if (dimensionTime === "date") {
      return raw.length === 8
        ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
        : raw;
    }
    return raw.length === 6 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
  };

  const translatePrevToCur = (key: string) =>
    dimensionTime === "yearMonth" ? plusOneMonthYM(key) : plusOneDayISO(key);

  async function fetchUsersSeries(
    range: Range,
    isPrev = false
  ): Promise<Point[]> {
    const req: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: dimensionTime }],
      keepEmptyRows: false,
      orderBys: [{ dimension: { dimensionName: dimensionTime } }],
      limit: "100000",
    };
    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: req,
    });
    const dict = new Map<string, number>(dictKeys.map((k) => [k, 0]));
    for (const r of resp.data.rows ?? []) {
      const raw = String(r.dimensionValues?.[0]?.value ?? "");
      const k = normKey(raw);
      const kAligned = isPrev ? translatePrevToCur(k) : k;
      if (dict.has(kAligned))
        dict.set(kAligned, Number(r.metricValues?.[0]?.value ?? 0));
    }
    return dictKeys.map((k, i) => ({
      label: outLabels[i],
      value: dict.get(k) ?? 0,
    }));
  }

  async function fetchInteractionsSeries(
    range: Range,
    isPrev = false
  ): Promise<Point[]> {
    const req: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: dimensionTime }],
      keepEmptyRows: false,
      orderBys: [{ dimension: { dimensionName: dimensionTime } }],
      limit: "100000",
    };
    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: req,
    });
    const dict = new Map<string, number>(dictKeys.map((k) => [k, 0]));
    for (const r of resp.data.rows ?? []) {
      const raw = String(r.dimensionValues?.[0]?.value ?? "");
      const k = normKey(raw);
      const kAligned = isPrev ? translatePrevToCur(k) : k;
      if (dict.has(kAligned))
        dict.set(kAligned, Number(r.metricValues?.[0]?.value ?? 0));
    }
    return dictKeys.map((k, i) => ({
      label: outLabels[i],
      value: dict.get(k) ?? 0,
    }));
  }

  const [usersCur, usersPrev, interCur, interPrev] = await Promise.all([
    fetchUsersSeries(curRange, false),
    fetchUsersSeries(prevRange, true),
    fetchInteractionsSeries(curRange, false),
    fetchInteractionsSeries(prevRange, true),
  ]);

  const sum = (arr: Point[]) => arr.reduce((a, p) => a + p.value, 0);

  return {
    meta: {
      range: { current: curRange, previous: prevRange },
      granularity: gParam,
      timezone: "UTC",
      source: "wpideanto",
      property,
    },
    totals: {
      users: sum(usersCur),
      usersPrev: sum(usersPrev),
      interactions: sum(interCur),
      interactionsPrev: sum(interPrev),
    },
    series: {
      usersByBucket: usersCur,
      usersByBucketPrev: usersPrev,
      interactionsByBucket: interCur,
      interactionsByBucketPrev: interPrev,
    },
  };
}

/* ================= Handler ================= */
export async function handleOverviewRequest(
  req: Request
): Promise<OverviewResponse> {
  const { searchParams } = new URL(req.url);

  const gParam = (
    searchParams.get("granularity") ||
    searchParams.get("g") ||
    "d"
  ).toLowerCase() as Granularity;

  const endISO = searchParams.get("end") || yesterdayISO();

  return queryOverview(gParam, endISO);
}
