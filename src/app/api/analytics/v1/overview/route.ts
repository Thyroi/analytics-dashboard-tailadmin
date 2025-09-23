// app/api/analytics/v1/overview/route.ts
import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { Granularity } from "@/lib/types";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import { toISO, parseISO, addDaysUTC, deriveAutoRangeForGranularity } from "@/lib/utils/datetime";

/* ================= Tipos de respuesta ================= */
type Point = { label: string; value: number };

type OverviewPayload = {
  meta: {
    range: { start: string; end: string };
    granularity: Granularity; // "d" | "w" | "m"
    timezone: "UTC";
    source: "wpideanto";
    property: string;
  };
  totals: {
    users: number;        // activeUsers (sin dimensión) del período
    interactions: number; // eventCount del período
  };
  series: {
    usersByBucket: Point[];
    interactionsByBucket: Point[];
  };
};

/* ================= Helpers locales mínimos ================= */
function listDatesISO(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let d = parseISO(startISO);
  const end = parseISO(endISO);
  for (; d.getTime() <= end.getTime(); d = addDaysUTC(d, 1)) {
    out.push(toISO(d));
  }
  return out;
}

// ISO week helpers: YYYY-WW
function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - ((d.getUTCDay() || 7))); // jueves de esa semana
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}
function weekSpanLabels(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const labels = new Set<string>();
  // avanzamos por días pero registramos el bucket de semana (evita huecos si el rango no es múltiplo de 7)
  for (let d = new Date(s); d <= e; d = addDaysUTC(d, 1)) {
    const { year, week } = isoWeek(d);
    labels.add(`${year}-W${String(week).padStart(2, "0")}`);
  }
  return Array.from(labels).sort();
}
function monthSpanLabels(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const out: string[] = [];
  let y = s.getUTCFullYear();
  let m = s.getUTCMonth();
  while (y < e.getUTCFullYear() || (y === e.getUTCFullYear() && m <= e.getUTCMonth())) {
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return out;
}

/* ================= Handler ================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    // Sólo soportamos "d" | "w" | "m" aquí. Si llega "y", el cliente ya lo mapea a "m".
    const granParam = (searchParams.get("granularity") || "d").toLowerCase();
    const granularity: Granularity =
      granParam === "w" ? "w" : granParam === "m" ? "m" : "d";

    // Rango: si no pasan start/end, usamos preset rolling según granularidad
    const auto = deriveAutoRangeForGranularity(granularity);
    const range = start && end ? { start, end } : { start: auto.startTime, end: auto.endTime };

    // Auth + GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    /* 1) Totales sin dimensión (usuarios correctos de-duplicados + interacciones) */
    const reqTotals: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
      keepEmptyRows: false,
      limit: "1",
    };
    const respTotals = await analyticsData.properties.runReport({
      property,
      requestBody: reqTotals,
    });
    const totalsRow = (respTotals.data.rows ?? [])[0];
    const usersTotal = totalsRow ? Number(totalsRow.metricValues?.[0]?.value ?? 0) : 0;
    const interactionsTotal = totalsRow ? Number(totalsRow.metricValues?.[1]?.value ?? 0) : 0;

    /* 2) Series por granularidad (con zero-fill de buckets) */
    let usersSeries: Point[] = [];
    let interactionsSeries: Point[] = [];

    if (granularity === "d") {
      // Diario: dimensión "date" → YYYYMMDD
      const reqDaily: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
        dimensions: [{ name: "date" }],
        keepEmptyRows: false,
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: "100000",
      };
      const respDaily = await analyticsData.properties.runReport({
        property,
        requestBody: reqDaily,
      });

      const baseUsers = new Map<string, number>();
      const baseInter = new Map<string, number>();
      for (const d of listDatesISO(range.start, range.end)) {
        baseUsers.set(d, 0);
        baseInter.set(d, 0);
      }

      for (const r of respDaily.data.rows ?? []) {
        const dateRaw = String(r.dimensionValues?.[0]?.value ?? ""); // YYYYMMDD
        if (dateRaw.length !== 8) continue;
        const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
        baseUsers.set(iso, Number(r.metricValues?.[0]?.value ?? 0));
        baseInter.set(iso, Number(r.metricValues?.[1]?.value ?? 0));
      }

      usersSeries = Array.from(baseUsers.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([label, value]) => ({ label, value }));

      interactionsSeries = Array.from(baseInter.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([label, value]) => ({ label, value }));

    } else if (granularity === "w") {
      // Semanal: dimensión "yearWeek" → "YYYYWW"
      const reqWeek: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
        dimensions: [{ name: "yearWeek" }],
        keepEmptyRows: false,
        orderBys: [{ dimension: { dimensionName: "yearWeek" } }],
        limit: "100000",
      };
      const respWeek = await analyticsData.properties.runReport({
        property,
        requestBody: reqWeek,
      });

      const base: Record<string, { u: number; i: number }> = {};
      for (const label of weekSpanLabels(range.start, range.end)) {
        base[label] = { u: 0, i: 0 };
      }

      for (const r of respWeek.data.rows ?? []) {
        const yW = String(r.dimensionValues?.[0]?.value ?? ""); // "YYYYWW"
        if (yW.length !== 6) continue;
        const label = `${yW.slice(0, 4)}-W${yW.slice(4)}`;
        if (!base[label]) base[label] = { u: 0, i: 0 };
        base[label].u += Number(r.metricValues?.[0]?.value ?? 0);
        base[label].i += Number(r.metricValues?.[1]?.value ?? 0);
      }

      const labels = Object.keys(base).sort();
      usersSeries = labels.map((l) => ({ label: l, value: base[l].u }));
      interactionsSeries = labels.map((l) => ({ label: l, value: base[l].i }));

    } else {
      // Mensual: dimensión "month" → "YYYYMM"
      const reqMonth: analyticsdata_v1beta.Schema$RunReportRequest = {
        dateRanges: [{ startDate: range.start, endDate: range.end }],
        metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
        dimensions: [{ name: "month" }],
        keepEmptyRows: false,
        orderBys: [{ dimension: { dimensionName: "month" } }],
        limit: "100000",
      };
      const respMonth = await analyticsData.properties.runReport({
        property,
        requestBody: reqMonth,
      });

      const base: Record<string, { u: number; i: number }> = {};
      for (const label of monthSpanLabels(range.start, range.end)) {
        base[label] = { u: 0, i: 0 };
      }

      for (const r of respMonth.data.rows ?? []) {
        const ym = String(r.dimensionValues?.[0]?.value ?? ""); // "YYYYMM"
        if (ym.length !== 6) continue;
        const label = `${ym.slice(0, 4)}-${ym.slice(4)}`;
        if (!base[label]) base[label] = { u: 0, i: 0 };
        base[label].u += Number(r.metricValues?.[0]?.value ?? 0);
        base[label].i += Number(r.metricValues?.[1]?.value ?? 0);
      }

      const labels = Object.keys(base).sort();
      usersSeries = labels.map((l) => ({ label: l, value: base[l].u }));
      interactionsSeries = labels.map((l) => ({ label: l, value: base[l].i }));
    }

    const payload: OverviewPayload = {
      meta: {
        range,
        granularity,
        timezone: "UTC",
        source: "wpideanto",
        property,
      },
      totals: {
        users: usersTotal,
        interactions: interactionsTotal,
      },
      series: {
        usersByBucket: usersSeries,
        interactionsByBucket: interactionsSeries,
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
