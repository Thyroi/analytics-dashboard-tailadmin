/**
 * Helpers específicos para la ruta overview
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
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

function listYearMonthKeys(startISO: string, endISO: string): string[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const out: string[] = [];

  let current = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
  );
  const endMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)
  );

  while (current.getTime() <= endMonth.getTime()) {
    out.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}`
    );
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)
    );
  }

  return out;
}

/* ================= Query Principal ================= */
export async function queryOverview(
  granularity: Granularity,
  startISO?: string,
  endISO?: string
): Promise<OverviewResponse> {
  const gParam = granularity.toLowerCase() as Granularity;

  // Usar computeRangesForSeries para obtener current y previous
  // Para series, granularidad "d" = 7 días, resto = duración estándar
  const { current, previous } = computeRangesForSeries(
    gParam,
    startISO,
    endISO
  );

  const curRange: Range = current;
  const prevRange: Range = previous;

  // Config por granularidad para GA
  type DimName = "date" | "yearMonth";
  let dimensionTime: DimName;
  let dictKeys: string[];
  let outLabels: string[];

  if (gParam === "m") {
    // MES: buckets DIARIOS del rango current
    dimensionTime = "date";
    dictKeys = listDatesISO(curRange.start, curRange.end);
    outLabels = dictKeys.map((k) => k.slice(8, 10)); // "DD"
  } else if (gParam === "y") {
    // AÑO: 12 buckets MENSUALES del rango current
    dimensionTime = "yearMonth";
    dictKeys = listYearMonthKeys(curRange.start, curRange.end);
    outLabels = dictKeys.map((k) => k.slice(5, 7)); // "MM"
  } else {
    // D / W: buckets diarios del rango current
    dimensionTime = "date";
    dictKeys = listDatesISO(curRange.start, curRange.end);
    outLabels = dictKeys.map((k) => k.slice(5, 10)); // "MM-DD"
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

  // Para previous, alinear las claves al eje current usando offset
  const calculateOffset = (currentRange: Range, previousRange: Range) => {
    const curStart = parseISO(currentRange.start);
    const prevStart = parseISO(previousRange.start);
    const diffTime = curStart.getTime() - prevStart.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)); // días de diferencia
  };

  const offsetDays = calculateOffset(curRange, prevRange);

  const translatePrevToCur = (key: string) => {
    if (dimensionTime === "yearMonth") {
      // Para yearMonth, calcular offset en meses
      const [y, m] = key.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1, 1));
      const monthsOffset = Math.round(offsetDays / 30);
      const d2 = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthsOffset, 1)
      );
      return `${d2.getUTCFullYear()}-${String(d2.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}`;
    }
    // Para date, sumar offsetDays
    return toISO(addDaysUTC(parseISO(key), offsetDays));
  };

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

  const startISO = searchParams.get("start") || undefined;
  const endISO = searchParams.get("end") || undefined;

  return queryOverview(gParam, startISO, endISO);
}
