// app/api/analytics/v1/overview/route.ts
import type { Granularity } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

import { addDaysUTC, parseISO, toISO, todayUTC } from "@/lib/utils/time/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { buildLaggedAxisForGranularity } from "@/lib/utils/time/timeAxis";

/* ================= Tipos ================= */
type Point = { label: string; value: number };
type Range = { start: string; end: string };

type OverviewResponse = {
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

/* --- helpers año/mes --- */
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
/** 12 claves YYYY-MM desde (end - 11 meses) a end */
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
/** alinear previous (YYYY-MM) a las claves actuales sumando 1 mes */
function plusOneMonthYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  const d2 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return `${d2.getUTCFullYear()}-${String(d2.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

/* ================= Handler ================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const gParam = (
      searchParams.get("granularity") ||
      searchParams.get("g") ||
      "d"
    ).toLowerCase() as Granularity;

    // Ancla de fin (?end=YYYY-MM-DD); default: ayer UTC
    const endISO = searchParams.get("end") || yesterdayISO();

    // ===== Config por granularidad (rango + claves + labels) =====
    type DimName = "date" | "yearMonth";
    let dimensionTime: DimName;
    let curRange: Range;
    let prevRange: Range;
    let dictKeys: string[];
    let outLabels: string[];

    if (gParam === "m") {
      // === MES: buckets DIARIOS del MES de endISO (respeta 28/29/30/31)
      dimensionTime = "date";
      const nDays = daysInMonthOf(endISO);
      const startCur = toISO(addDaysUTC(parseISO(endISO), -(nDays - 1)));
      curRange = { start: startCur, end: endISO };
      // previous desplazado -1 día (ventana solapada)
      prevRange = {
        start: minusOneDayISO(startCur),
        end: minusOneDayISO(endISO),
      };
      dictKeys = listDatesISO(curRange.start, curRange.end); // YYYY-MM-DD
      outLabels = dictKeys.map((k) => k.slice(8, 10)); // "DD"
    } else if (gParam === "y") {
      // === AÑO: 12 buckets MENSUALES (solo MM)
      dimensionTime = "yearMonth";

      // RANGO ACTUAL: del 1º de hace 11 meses hasta endISO (mes actual parcial)
      const curStart = firstDayOfMonthISO(endISO, 11);
      curRange = { start: curStart, end: endISO };

      // RANGO PREVIO (CORREGIDO): 1º de hace 12 meses .. último día del mes anterior
      const prevStart = firstDayOfMonthISO(endISO, 12);
      const prevEnd = lastDayOfMonthISO(addMonthsISO(endISO, -1));
      prevRange = { start: prevStart, end: prevEnd };

      // 12 claves YYYY-MM actuales y labels "MM"
      dictKeys = listLast12YearMonthKeys(endISO);
      outLabels = dictKeys.map((k) => k.slice(5, 7)); // "01".."12"
    } else {
      // === D / W: eje diario + previous desfase -1 día
      const axis = buildLaggedAxisForGranularity(gParam, { endISO });

      curRange = axis.curRange as Range;
      prevRange = {
        start: minusOneDayISO(curRange.start),
        end: minusOneDayISO(curRange.end),
      };

      dictKeys = axis.xLabels as string[]; // YYYY-MM-DD
      dimensionTime = "date";
      outLabels = dictKeys;
    }

    // ===== GA =====
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Normalizar claves que devuelve GA
    const normKey = (raw: string) => {
      if (dimensionTime === "date") {
        return raw.length === 8
          ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
          : raw;
      }
      // yearMonth → "YYYYMM" a "YYYY-MM"
      return raw.length === 6 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
    };

    // Alinear previous a las claves actuales (y: +1 mes, d/w: +1 día)
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

    // ⬇⬇⬇ CAMBIO AQUÍ: eventCount **SIN** filtrar a page_view (todas las interacciones GA4)
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
    const payload: OverviewResponse = {
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

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "InternalError", message: msg } },
      { status: 500 }
    );
  }
}
