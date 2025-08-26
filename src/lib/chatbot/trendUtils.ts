// src/lib/chatbot/trendUtils.ts

import { SERIES } from "@/lib/mockData";

/* ========= Date helpers ========= */
export function parseISO(d: string): Date | null {
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, da = Number(m[3] ?? "1");
  const dt = new Date(Date.UTC(y, mo, da));
  return isNaN(dt.getTime()) ? null : dt;
}
export function toISODay(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function addDays(dt: Date, n: number): Date {
  const c = new Date(dt);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}
export function startOfWeekUTC(dt: Date): Date {
  const day = dt.getUTCDay();            // 0..6 (Domingo=0)
  const offset = (day + 6) % 7;          // 0->6, 1->0, ..., 6->5
  return addDays(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())), -offset);
}
export function startOfMonthUTC(dt: Date): Date {
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1));
}
export function endOfMonthUTC(dt: Date): Date {
  const firstNext = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1));
  return addDays(firstNext, -1);
}

/* ========= Labels ========= */
export function fmtDateLabel(bucket: string): string {
  // Si es YYYY-MM-DD -> "dd MMM", si no (semana/mes) lo dejamos como viene.
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    const dt = parseISO(bucket)!;
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }
  return bucket;
}

/* ========= Aggregations ========= */
export function sumDaily(tags: string[], isoDay: string): number {
  let s = 0;
  for (const t of tags) s += SERIES[t]?.[isoDay] ?? 0;
  return s;
}

/** Ventana ANTERIOR robusta (día/semana/mes) con mismo largo que `categories`. */
export function buildPrevWindowFallback(
  tags: string[],
  categories: string[],
  gran: "day" | "week" | "month"
): number[] {
  const n = categories.length;
  if (n === 0) return [];

  const firstKey = categories[0];
  const firstDt = parseISO(firstKey) ?? new Date(Date.parse(firstKey));

  if (gran === "day") {
    const startPrev = addDays(firstDt, -n);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = addDays(startPrev, i);
      out.push(sumDaily(tags, toISODay(d)));
    }
    return out;
  }

  if (gran === "week") {
    const firstWeekStart = startOfWeekUTC(firstDt);
    const prevStart = addDays(firstWeekStart, -7 * n);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const wStart = addDays(prevStart, i * 7);
      let sum = 0;
      for (let k = 0; k < 7; k++) sum += sumDaily(tags, toISODay(addDays(wStart, k)));
      out.push(sum);
    }
    return out;
  }

  // month
  const firstMonthStart = startOfMonthUTC(firstDt);
  const prevFirst = new Date(Date.UTC(firstMonthStart.getUTCFullYear(), firstMonthStart.getUTCMonth() - n, 1));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const mStart = new Date(Date.UTC(prevFirst.getUTCFullYear(), prevFirst.getUTCMonth() + i, 1));
    const mEnd = endOfMonthUTC(mStart);
    let sum = 0;
    for (let d = new Date(mStart); d <= mEnd; d = addDays(d, 1)) {
      sum += sumDaily(tags, toISODay(d));
    }
    out.push(sum);
  }
  return out;
}
