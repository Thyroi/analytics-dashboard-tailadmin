import { SERIES } from "@/lib/mockData";

export type TagTotal = { tag: string; total: number };
export type Granularity = "day" | "week" | "month";

/* ======= utilidades existentes (puedes dejarlas como ya las tengas) ======= */
export function getLastDate(series: typeof SERIES): string {
  let last = "";
  for (const [k, byDate] of Object.entries(series)) {
    if (k.includes(".")) continue;
    for (const d of Object.keys(byDate)) if (d > last) last = d;
  }
  return last;
}
function parseISO(d: string) { return new Date(d + "T00:00:00Z"); }
function formatISO(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function lastNDates(endISO: string, n: number) {
  const arr: string[] = []; let d = parseISO(endISO);
  for (let i=0;i<n;i++){ arr.unshift(formatISO(d)); d = addDays(d,-1); }
  return arr;
}

export function datesForGranularity(series: typeof SERIES, gran: Granularity): string[] {
  const end = getLastDate(series); if (!end) return [];
  if (gran === "day") return [end];
  if (gran === "week") return lastNDates(end, 7);
  return lastNDates(end, 30);
}

export function computeTop(series: typeof SERIES, dates: string[]) {
  const rows: Array<{ tag: string; total: number }> = [];
  for (const [key, byDate] of Object.entries(series)) {
    if (key.includes(".")) continue;
    let sum = 0; for (const d of dates) sum += byDate[d] ?? 0;
    rows.push({ tag: key, total: sum });
  }
  rows.sort((a,b)=>b.total-a.total);
  return rows;
}

export function computeRootTotals(series: typeof SERIES): TagTotal[] {
  const rows: TagTotal[] = [];
  for (const [key, byDate] of Object.entries(series)) {
    if (key.includes(".")) continue;
    let sum = 0; for (const v of Object.values(byDate)) sum += v ?? 0;
    rows.push({ tag: key, total: sum });
  }
  rows.sort((a,b)=>b.total-a.total);
  return rows;
}

/* ======= NUEVO: construir categorías/series para la gráfica ======= */
function isoWeekKey(dateISO: string): string {
  const d = parseISO(dateISO);
  // ISO week (lunes inicio). Algoritmo simple:
  const tgt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (tgt.getUTCDay()+6)%7;  // 0..6, 0=lunes
  tgt.setUTCDate(tgt.getUTCDate()-day+3);
  const firstThu = new Date(Date.UTC(tgt.getUTCFullYear(),0,4));
  const week = 1 + Math.round(
    ((tgt.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay()+6)%7)) / 7
  );
  return `${tgt.getUTCFullYear()}-W${String(week).padStart(2,"0")}`;
}
function monthKey(dateISO: string): string {
  return dateISO.slice(0,7); // YYYY-MM
}

/** Devuelve { categories, series } listos para LineChart */
export function buildTrendForTags(
  series: typeof SERIES,
  tagIds: string[],
  gran: Granularity
): { categories: string[]; series: { name: string; data: number[] }[] } {
  const end = getLastDate(series);
  if (!end || tagIds.length === 0) return { categories: [], series: [] };

  if (gran === "day") {
    const dates = lastNDates(end, 30);
    return {
      categories: dates,
      series: tagIds.map((t) => ({
        name: t,
        data: dates.map((d) => series[t]?.[d] ?? 0),
      })),
    };
  }

  if (gran === "week") {
    const dates = lastNDates(end, 7 * 8); // 8 semanas
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

  // month → últimos 6 meses
  const dates = lastNDates(end, 31 * 7); // suficiente para 6 meses
  const keysAll = dates.map(monthKey);
  const keys = Array.from(new Set(keysAll)).slice(-6);
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
