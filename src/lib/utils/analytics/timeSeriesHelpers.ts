/**
 * Utilidades para series temporales (line charts)
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { runReportLimited } from "@/lib/utils/analytics/ga4RateLimit";
import {
  deriveAutoRangeForGranularity,
  deriveRangeEndingYesterday,
  parseISO,
  toISO,
  todayUTC,
} from "@/lib/utils/time/datetime";
import { analyticsdata_v1beta, google } from "googleapis";

/* ======================= Tipos ======================= */
export type Point = { label: string; value: number };
export type Range = { start: string; end: string };

export type XYSeries = { name: string; data: number[] };

export type TopPagesRangePayload = {
  range: Range;
  property: string;
  categoriesLabels: string[]; // días YYYY-MM-DD
  series: XYSeries[]; // Top N + (opcional) "Total"
  top: number;
  metric: "screenPageViews";
};

export type SeriesItem = { name: string; data: number[] };
export type AcquisitionRangePayload = {
  range: Range;
  property: string;
  categoriesLabels: string[]; // eje X (días o meses según granularidad)
  series: SeriesItem[]; // por canal + "Total"
};

/* ======================= Utilidades Temporales ======================= */

export function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()),
  );
  const out: string[] = [];
  while (cur <= end) {
    out.push(toISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function ymLabel(y: number, mZeroBased: number): string {
  const mm = String(mZeroBased + 1).padStart(2, "0");
  return `${y}-${mm}`;
}

export function ymKey(y: number, mZeroBased: number): string {
  const mm = String(mZeroBased + 1).padStart(2, "0");
  return `${y}${mm}`;
}

/** Últimos n meses (incluyendo el mes de `endDate`) */
export function listLastNMonths(
  endDate: Date,
  n = 12,
): {
  labels: string[]; // ["YYYY-MM", ...]
  keys: string[]; // ["YYYYMM", ...] para mapear contra GA
  indexByKey: Map<string, number>;
} {
  const labels: string[] = [];
  const keys: string[] = [];
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - i, 1));
    labels.push(ymLabel(d.getUTCFullYear(), d.getUTCMonth()));
    keys.push(ymKey(d.getUTCFullYear(), d.getUTCMonth()));
  }
  return { labels, keys, indexByKey: new Map(keys.map((k, i) => [k, i])) };
}

/* ======================= Queries Específicas ======================= */

/**
 * Query para top pages con series temporales
 */
export async function queryTopPagesRange(
  granularity: Granularity,
  start?: string,
  end?: string,
  top: number = 5,
  includeTotal: boolean = true,
): Promise<TopPagesRangePayload> {
  const range =
    start && end
      ? { start, end }
      : (() => {
          const r = deriveAutoRangeForGranularity(granularity);
          return { start: r.start, end: r.end };
        })();

  const days = enumerateDaysUTC(range.start, range.end);
  const idxByDay = new Map(days.map((d, i) => [d, i]));

  // Auth + GA
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // Vistas por título de página y día
  const request: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "screenPageViews" }],
    dimensions: [{ name: "pageTitle" }, { name: "date" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    keepEmptyRows: false,
    limit: "100000",
  };

  const resp = await runReportLimited(analytics, {
    property,
    requestBody: request,
  });

  const rows = resp.data.rows ?? [];

  // 1) Totales por título para decidir el Top N
  const totalsByTitle = new Map<string, number>();
  for (const r of rows) {
    const title = String(r.dimensionValues?.[0]?.value || "(not set)");
    const v = Number(r.metricValues?.[0]?.value || 0);
    totalsByTitle.set(title, (totalsByTitle.get(title) ?? 0) + v);
  }
  const topTitles = [...totalsByTitle.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name]) => name);
  const topSet = new Set(topTitles);

  // 2) Construir series por día SOLO para el Top N (+ Total opcional)
  const seriesMap = new Map<string, number[]>();
  for (const t of topTitles) seriesMap.set(t, Array(days.length).fill(0));
  const totalData = includeTotal ? Array(days.length).fill(0) : null;

  for (const r of rows) {
    const title = String(r.dimensionValues?.[0]?.value || "(not set)");
    const d8 = String(r.dimensionValues?.[1]?.value || "");
    if (d8.length !== 8) continue;
    const iso = `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
    const idx = idxByDay.get(iso);
    if (idx === undefined) continue;

    const v = Number(r.metricValues?.[0]?.value || 0);

    if (totalData) totalData[idx] += v;
    if (topSet.has(title)) {
      const vec = seriesMap.get(title)!;
      vec[idx] += v;
    }
  }

  const series: XYSeries[] = topTitles.map((name) => ({
    name,
    data: seriesMap.get(name)!,
  }));
  if (includeTotal && totalData) {
    series.unshift({ name: "Total", data: totalData });
  }

  return {
    range,
    property,
    categoriesLabels: days,
    series,
    top,
    metric: "screenPageViews",
  };
}

/**
 * Query para user acquisition con series temporales
 */
export async function queryUserAcquisitionRange(
  granularity: Granularity,
  start?: string,
  end?: string,
  includeTotal: boolean = true,
): Promise<AcquisitionRangePayload> {
  // Rango actual: si no pasan start/end, usar ventana que TERMINA AYER.
  const range =
    start && end
      ? { start, end }
      : (() => {
          const dayAsWeek = granularity === "d";
          const r = deriveRangeEndingYesterday(
            granularity,
            todayUTC(),
            dayAsWeek,
          );
          return r;
        })();

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // d / w / m => por día ; y => por mes (yearMonth)
  const isYearlyMonthly = granularity === "y";

  let categoriesLabels: string[];
  let indexBySlot: Map<string, number>;
  let dimensionTime: "date" | "yearMonth";

  if (isYearlyMonthly) {
    const endDate = parseISO(range.end);
    const { labels, indexByKey } = listLastNMonths(endDate, 12);
    categoriesLabels = labels; // ["YYYY-MM", ...]
    indexBySlot = indexByKey; // índices por "YYYYMM"
    dimensionTime = "yearMonth";
  } else {
    categoriesLabels = enumerateDaysUTC(range.start, range.end); // 7, 30 o 365 días
    indexBySlot = new Map(categoriesLabels.map((d, i) => [d, i])); // "YYYY-MM-DD"
    dimensionTime = "date";
  }

  // Consulta: usuarios activos por canal y slot temporal
  const request: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "activeUsers" }],
    dimensions: [
      { name: "firstUserDefaultChannelGroup" },
      { name: dimensionTime },
    ],
    orderBys: [
      { dimension: { dimensionName: dimensionTime } },
      { metric: { metricName: "activeUsers" }, desc: true },
    ],
    keepEmptyRows: false,
    limit: "100000",
  };

  const resp = await runReportLimited(analytics, {
    property,
    requestBody: request,
  });

  const rows = resp.data.rows ?? [];

  // Canal -> vector de slots, prellenado con 0s
  const seriesMap = new Map<string, number[]>();
  const totalsByChannel = new Map<string, number>();

  for (const r of rows) {
    const channel = String(r.dimensionValues?.[0]?.value || "Unassigned");
    const slotRaw = String(r.dimensionValues?.[1]?.value || "");
    let key: string | null = null;

    if (dimensionTime === "date") {
      // YYYYMMDD -> YYYY-MM-DD
      if (slotRaw.length === 8) {
        key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
          6,
          8,
        )}`;
      }
    } else {
      // yearMonth -> YYYYMM
      if (slotRaw.length === 6) key = slotRaw;
    }

    if (!key) continue;
    const idx = indexBySlot.get(key);
    if (idx === undefined) continue;

    const v = Number(r.metricValues?.[0]?.value || 0);

    if (!seriesMap.has(channel)) {
      seriesMap.set(channel, Array(categoriesLabels.length).fill(0));
    }
    const vec = seriesMap.get(channel)!;
    vec[idx] += v;
    totalsByChannel.set(channel, (totalsByChannel.get(channel) ?? 0) + v);
  }

  // Ordenamos canales por total desc y generamos series
  const channels = [...seriesMap.keys()].sort(
    (a, b) => (totalsByChannel.get(b) ?? 0) - (totalsByChannel.get(a) ?? 0),
  );

  const series: SeriesItem[] = channels.map((name) => ({
    name,
    data: seriesMap.get(name)!,
  }));

  if (includeTotal) {
    const totalData = Array(categoriesLabels.length).fill(0);
    for (const s of series) {
      for (let i = 0; i < categoriesLabels.length; i++) {
        totalData[i] += s.data[i];
      }
    }
    series.unshift({ name: "Total", data: totalData });
  }

  return {
    range: { start: range.start, end: range.end },
    property,
    categoriesLabels,
    series,
  };
}

/* ======================= Handlers ======================= */

/**
 * Handler para top pages range
 */
export async function handleTopPagesRangeRequest(
  req: Request,
): Promise<TopPagesRangePayload> {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const g = (searchParams.get("granularity") || "d") as Granularity;
  const top = Math.max(1, Math.min(20, Number(searchParams.get("top") || "5")));
  const includeTotal = (searchParams.get("includeTotal") ?? "1") !== "0";

  return queryTopPagesRange(g, start, end, top, includeTotal);
}

/**
 * Handler para user acquisition range
 */
export async function handleUserAcquisitionRangeRequest(
  req: Request,
): Promise<AcquisitionRangePayload> {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const g = (searchParams.get("granularity") || "d") as Granularity;
  const includeTotal = (searchParams.get("includeTotal") ?? "1") !== "0";

  return queryUserAcquisitionRange(g, start, end, includeTotal);
}
