/**
 * Utilidades de fecha en UTC y presets de rango por granularidad.
 * 🔧 Unificado: TODAS las funciones devuelven { start, end } (YYYY-MM-DD)
 */

import type { Granularity } from "@/lib/types";

/* ==================== Tipos ==================== */
export type DateRange = { start: string; end: string };

/* ==================== Helpers base UTC ==================== */

export function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export function addDaysUTC(d: Date, n: number): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function addMonthsUTC(d: Date, n: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const tmp = new Date(Date.UTC(y, m + n, 1));
  // clamp día
  const last = endOfMonthUTC(tmp).getUTCDate();
  const dd = Math.min(day, last);
  return new Date(Date.UTC(tmp.getUTCFullYear(), tmp.getUTCMonth(), dd));
}

export function addYearsUTC(d: Date, n: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate())
  );
}

export function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

export function startOfYearUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

export function endOfYearUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 11, 31));
}

export function daysDiffInclusive(s: Date, e: Date): number {
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

/* ==================== Presets (referencia) ==================== */
export const PRESET_DAY_COUNT = 7;
export const PRESET_WEEK_COUNT = 4;
export const PRESET_MONTH_COUNT = 6;
export const PRESET_YEAR_COUNT = 2;

/* ==================== Utilidades extra ==================== */

export function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  );
  const end = new Date(
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  );
  const out: string[] = [];
  while (cur <= end) {
    out.push(toISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function isFutureISO(iso: string): boolean {
  return parseISO(iso) > todayUTC();
}

export function ensureOrdered(a: string, b: string): DateRange {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/** Normaliza cualquier shape a {start,end} */
export function normalizeRange(
  range: { start: string; end: string } | { startTime: string; endTime: string }
): DateRange {
  if ("start" in range && "end" in range) return range;
  return { start: range.startTime, end: range.endTime };
}

/** (Sólo si necesitas compatibilidad puntual con código legacy) */
export function toLegacyTimeRange(range: DateRange): {
  startTime: string;
  endTime: string;
} {
  return { startTime: range.start, endTime: range.end };
}

/* ==================== Rangos por granularidad ==================== */
/**
 * Reglas (rolling, incluye "now"):
 *  - "d": últimos 7 días
 *  - "w": últimos 28 días
 *  - "m": últimos 30 días (no mes calendario)
 *  - "y": YTD (01-01 del año vigente … now)
 */
export function deriveAutoRangeForGranularity(
  g: Granularity,
  now: Date = todayUTC()
): DateRange {
  if (g === "d") {
    const end = now;
    const start = addDaysUTC(end, -6);
    return { start: toISO(start), end: toISO(end) };
  }

  if (g === "w") {
    const end = now;
    const start = addDaysUTC(end, -27);
    return { start: toISO(start), end: toISO(end) };
  }

  if (g === "m") {
    const end = now;
    const start = addDaysUTC(end, -29);
    return { start: toISO(start), end: toISO(end) };
  }

  // g === "y" -> YTD
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = now;
  return { start: toISO(start), end: toISO(end) };
}

/**
 * Rango que TERMINA AYER:
 *  - "d": 1 día (ayer…ayer) o 7 días si dayAsWeek=true
 *  - "w": 7 días hasta ayer
 *  - "m": 30 días hasta ayer
 *  - "y": 365 días hasta ayer
 */
export function deriveRangeEndingYesterday(
  g: Granularity,
  now: Date = todayUTC(),
  dayAsWeek = false
): DateRange {
  const yesterday = addDaysUTC(now, -1);

  if (g === "d") {
    if (dayAsWeek) {
      const start = addDaysUTC(yesterday, -(7 - 1));
      return { start: toISO(start), end: toISO(yesterday) };
    }
    return { start: toISO(yesterday), end: toISO(yesterday) };
  }

  if (g === "w") {
    const start = addDaysUTC(yesterday, -(7 - 1));
    return { start: toISO(start), end: toISO(yesterday) };
  }

  if (g === "m") {
    const start = addDaysUTC(yesterday, -(30 - 1));
    return { start: toISO(start), end: toISO(yesterday) };
  }

  const start = addDaysUTC(yesterday, -(365 - 1));
  return { start: toISO(start), end: toISO(yesterday) };
}

/**
 * Rango anterior DESPLAZADO (misma longitud):
 *  - "d": -1 día
 *  - "w": -7 días
 *  - "m": -30 días
 *  - "y": -1 año
 */
export function derivePrevShifted(
  current: DateRange,
  g: Granularity
): DateRange {
  const s = parseISO(current.start);
  const e = parseISO(current.end);

  if (g === "y") {
    return { start: toISO(addYearsUTC(s, -1)), end: toISO(addYearsUTC(e, -1)) };
  }

  const shiftDays = g === "d" ? 1 : g === "w" ? 7 : 30;
  return {
    start: toISO(addDaysUTC(s, -shiftDays)),
    end: toISO(addDaysUTC(e, -shiftDays)),
  };
}

/** (Deprecated) Chunk anterior contiguo con misma longitud */
export function prevComparable(current: DateRange): DateRange {
  const s = parseISO(current.start);
  const e = parseISO(current.end);
  const days = daysDiffInclusive(s, e);
  const prevEnd = addDaysUTC(s, -1);
  const prevStart = addDaysUTC(prevEnd, -(days - 1));
  return { start: toISO(prevStart), end: toISO(prevEnd) };
}

/** (Compat) igual que derivePrevShifted pero manteniendo firma previa */
export function prevComparableForGranularity(
  range: DateRange,
  g: Granularity
): DateRange {
  return derivePrevShifted(range, g);
}

export function prevComparableSameLength(range: DateRange): DateRange {
  return prevComparable(range);
}

/* ==================== Builder central para endpoints ==================== */
/**
 * Construye current/previous coherentes:
 *  - Si pasan start+end → respeta y alinea previous (derivePrevShifted)
 *  - Si pasan solo end → clamp a AYER; build preset por granularidad
 *  - Si no pasan nada → AYER por granularidad (con dayAsWeek para 'd' si lo pides)
 */
export function computeRanges(opts: {
  g: Granularity;
  startISO?: string;
  endISO?: string;
  seriesExpandDay?: boolean; // si g='d' y quieres 7 slots para series
}): { current: DateRange; previous: DateRange } {
  const { g, startISO, endISO, seriesExpandDay } = opts;

  // 1) start+end explícitos
  if (startISO && endISO) {
    const endClamped = isFutureISO(endISO)
      ? toISO(addDaysUTC(todayUTC(), -1))
      : endISO;
    const current = ensureOrdered(startISO, endClamped);
    const previous = derivePrevShifted(current, g);
    return { current, previous };
  }

  // 2) solo end → clamp a ayer; presets “ending yesterday”
  const baseNow = endISO ? parseISO(endISO) : todayUTC();

  if (g === "y") {
    // 365 terminando ayer + previous desplazado un año
    const current = deriveRangeEndingYesterday("y", baseNow);
    const previous = derivePrevShifted(current, "y");
    return { current, previous };
  }

  // d / w / m
  if (g === "d") {
    const current = deriveRangeEndingYesterday(
      "d",
      baseNow,
      Boolean(seriesExpandDay)
    );
    const previous = derivePrevShifted(current, "d");
    return { current, previous };
  }

  const current = deriveRangeEndingYesterday(g, baseNow);
  const previous = derivePrevShifted(current, g);
  return { current, previous };
}
