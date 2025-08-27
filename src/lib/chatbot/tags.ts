import { SERIES } from "@/lib/mockData";

export type TagTotal = { tag: string; total: number };
export type Granularity = "day" | "week" | "month";
export type SeriesByDate = Record<string, number>;
export type SeriesMap = Record<string, SeriesByDate>;
export type SubtagRow = { key: string; label: string; total: number };

/* ===== helpers base de fechas ===== */
export function getLastDate(series: typeof SERIES): string {
  let last = "";
  for (const [k, byDate] of Object.entries(series)) {
    if (k.includes(".")) continue; // solo tags raíz para encontrar el final global
    for (const d of Object.keys(byDate)) if (d > last) last = d;
  }
  return last;
}
function parseISO(d: string) { return new Date(d + "T00:00:00Z"); }
function formatISO(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }

function daysRange(start: Date, end: Date): string[] {
  const out: string[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) out.push(formatISO(d));
  return out;
}

/** ⬅️ Ventanas unificadas y exactas */
export function datesForGranularity(series: typeof SERIES, gran: Granularity): string[] {
  const endISO = getLastDate(series); if (!endISO) return [];
  const end = parseISO(endISO);

  if (gran === "day") {
    const start = addDays(end, -29); // 30 días exactos
    return daysRange(start, end);
  }

  if (gran === "week") {
    const start = addDays(end, -((7 * 8) - 1)); // 8 semanas (56 días) exactos
    return daysRange(start, end);
  }

  // month → últimos 6 meses exactos (desde el 1er día del mes de inicio hasta end)
  const endMonthFirst = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const startMonthFirst = new Date(Date.UTC(endMonthFirst.getUTCFullYear(), endMonthFirst.getUTCMonth() - 5, 1));
  return daysRange(startMonthFirst, end);
}

/* ===== cálculos de totales raíz ===== */
export function computeTop(series: typeof SERIES, dates: string[]) {
  const rows: Array<{ tag: string; total: number }> = [];
  for (const [key, byDate] of Object.entries(series)) {
    if (key.includes(".")) continue;
    let sum = 0; for (const d of dates) sum += byDate[d] ?? 0;
    rows.push({ tag: key, total: sum });
  }
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

export function computeRootTotals(series: typeof SERIES): TagTotal[] {
  const rows: TagTotal[] = [];
  for (const [key, byDate] of Object.entries(series)) {
    if (key.includes(".")) continue;
    let sum = 0; for (const v of Object.values(byDate)) sum += v ?? 0;
    rows.push({ tag: key, total: sum });
  }
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

/* ===== subtags ===== */
export function prettySubtagLabel(raw: string): string {
  const withSpaces = raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return withSpaces.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function sumSubtagInDays(series: typeof SERIES, subtagKey: string, days: Set<string>): number {
  const byDate = (series as unknown as SeriesMap)[subtagKey];
  if (!byDate) return 0;
  let s = 0;
  for (const d of Object.keys(byDate)) if (days.has(d)) s += byDate[d] ?? 0;
  return s;
}

export function buildSubtagRows(
  series: typeof SERIES,
  rootTag: string,
  windowDays: Set<string>
): SubtagRow[] {
  const keys = Object.keys(series).filter((k) => k.startsWith(`${rootTag}.`));
  const rows: SubtagRow[] = keys.map((key) => {
    const total = sumSubtagInDays(series, key, windowDays);
    const sub = key.split(".")[1] ?? key;
    return { key, label: prettySubtagLabel(sub), total };
  });
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

/* ===== helpers de bucketing para comparativa ===== */
function isoWeekKey(dateISO: string): string {
  const d = parseISO(dateISO);
  const tgt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (tgt.getUTCDay() + 6) % 7;  // 0..6, 0=lunes
  tgt.setUTCDate(tgt.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(tgt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((tgt.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7
  );
  return `${tgt.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function monthKey(dateISO: string): string { return dateISO.slice(0, 7); }

/** Construye trend usando SU propia lógica de ventana (fallback) */
export function buildTrendForTags(
  series: typeof SERIES,
  tagIds: string[],
  gran: Granularity
): { categories: string[]; series: { name: string; data: number[] }[] } {
  const dates = datesForGranularity(series, gran);
  return buildTrendForTagsFromDates(series, tagIds, dates, gran);
}

/** ⬅️ Nuevo: construir trend a partir de un arreglo *concreto* de fechas */
export function buildTrendForTagsFromDates(
  series: typeof SERIES,
  tagIds: string[],
  dates: string[],
  gran: Granularity
): { categories: string[]; series: { name: string; data: number[] }[] } {
  if (dates.length === 0 || tagIds.length === 0) return { categories: [], series: [] };

  if (gran === "day") {
    return {
      categories: dates,
      series: tagIds.map((t) => ({
        name: t,
        data: dates.map((d) => series[t]?.[d] ?? 0),
      })),
    };
  }

  if (gran === "week") {
    const keys = Array.from(new Set(dates.map(isoWeekKey)));
    return {
      categories: keys,
      series: tagIds.map((t) => ({
        name: t,
        data: keys.map((k) =>
          dates.filter((d) => isoWeekKey(d) === k).reduce((a, d) => a + (series[t]?.[d] ?? 0), 0)
        ),
      })),
    };
  }

  // month
  const keysAll = dates.map(monthKey);
  const keys = Array.from(new Set(keysAll)).slice(-6); // garantizar 6 buckets
  return {
    categories: keys,
    series: tagIds.map((t) => ({
      name: t,
      data: keys.map((k) =>
        dates.filter((d) => monthKey(d) === k).reduce((a, d) => a + (series[t]?.[d] ?? 0), 0)
      ),
    })),
  };
}
