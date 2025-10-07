/**
 * Utilidades de fecha en UTC y presets de rango por granularidad.
 * Unificamos dos "shapes":
 *  - GA4Preset: { startTime, endTime }  -> lo que pide GA4
 *  - DateRange: { start, end }          -> lo que usamos internamente
 */

import type { Granularity } from "@/lib/types";

/* ==================== Tipos unificados ==================== */

export type GA4Preset = { startTime: string; endTime: string };
export type DateRange = { start: string; end: string };

export function presetToRange(p: GA4Preset): DateRange {
  return { start: p.startTime, end: p.endTime };
}
export function rangeToPreset(r: DateRange): GA4Preset {
  return { startTime: r.start, endTime: r.end };
}

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

/* ==================== Presets por granularidad ==================== */
/**
 * Cantidades configurables por preset (para UI de auto-rangos):
 *  - Día: 7 días
 *  - Semana: 4 semanas (28 días)
 *  - Mes: 30 días (rolling)
 *  - Año: YTD
 */
export const PRESET_DAY_COUNT = 7;
export const PRESET_WEEK_COUNT = 4;
export const PRESET_MONTH_COUNT = 6; // no se usa en las reglas "rolling" nuevas, lo dejamos a mano
export const PRESET_YEAR_COUNT = 2;

/**
 * Rango sugerido por granularidad, terminando HOY (UTC).
 * - "d": últimos 7 días (rolling)
 * - "w": últimos 28 días (rolling)
 * - "m": últimos 30 días (rolling)
 * - "y": YTD (01-01…hoy)
 */
export function deriveAutoRangeForGranularity(
  g: Granularity,
  now: Date = todayUTC()
): DateRange {
  if (g === "d") {
    const end = now;
    const start = addDaysUTC(end, -6); // 7 días inclusivos
    return { start: toISO(start), end: toISO(end) };
  }

  if (g === "w") {
    const end = now;
    const start = addDaysUTC(end, -27); // 28 días inclusivos
    return { start: toISO(start), end: toISO(end) };
  }

  if (g === "m") {
    const end = now;
    const start = addDaysUTC(end, -29); // 30 días inclusivos
    return { start: toISO(start), end: toISO(end) };
  }

  // g === "y" -> YTD
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = now;
  return { start: toISO(start), end: toISO(end) };
}

/* ==================== Rango “terminando AYER” ==================== */
/**
 * Devuelve el rango que termina AYER (UTC), en formato GA4Preset.
 * - "d": si dayAsWeek=false → 1 día (ayer..ayer)
 *        si dayAsWeek=true  → 7 días terminando ayer
 * - "w": 7 días terminando ayer
 * - "m": 30 días terminando ayer
 * - "y": 365 días terminando ayer
 */
export function deriveRangeEndingYesterday(
  g: Granularity,
  now: Date = todayUTC(),
  dayAsWeek: boolean = false
): GA4Preset {
  const yesterday = addDaysUTC(now, -1);

  if (g === "d") {
    if (dayAsWeek) {
      const start = addDaysUTC(yesterday, -(7 - 1));
      return { startTime: toISO(start), endTime: toISO(yesterday) };
    }
    return { startTime: toISO(yesterday), endTime: toISO(yesterday) };
  }

  if (g === "w") {
    const start = addDaysUTC(yesterday, -(7 - 1));
    return { startTime: toISO(start), endTime: toISO(yesterday) };
  }

  if (g === "m") {
    const start = addDaysUTC(yesterday, -(30 - 1));
    return { startTime: toISO(start), endTime: toISO(yesterday) };
  }

  // g === "y"
  const start = addDaysUTC(yesterday, -(365 - 1));
  return { startTime: toISO(start), endTime: toISO(yesterday) };
}

/* ==================== Ventana desplazada (SOLAPE) ==================== */
/**
 * Versión DateRange:
 *  - "d": desplaza 1 día
 *  - "w": desplaza 7 días
 *  - "m": desplaza 30 días
 *  - "y": desplaza 1 año
 */
export function derivePrevShifted(
  current: DateRange,
  g: Granularity
): DateRange {
  const s = parseISO(current.start);
  const e = parseISO(current.end);

  if (g === "y") {
    const prevStart = addYearsUTC(s, -1);
    const prevEnd = addYearsUTC(e, -1);
    return { start: toISO(prevStart), end: toISO(prevEnd) };
  }

  const shiftDays = g === "d" ? 1 : g === "w" ? 7 : 30; // d=1, w=7, m=30
  const prevStart = addDaysUTC(s, -shiftDays);
  const prevEnd = addDaysUTC(e, -shiftDays);
  return { start: toISO(prevStart), end: toISO(prevEnd) };
}

/* ==================== Compatibilidad con código legado ==================== */
/**
 * (LEGACY) Si todavía tienes llamadas que usan GA4Preset:
 * prevComparable / prevComparableForGranularity siguen existiendo pero devuelven GA4Preset.
 * Recomendación: migra a derivePrevShifted(DateRange).
 */
export function prevComparable(preset: GA4Preset): GA4Preset {
  const s = parseISO(preset.startTime);
  const e = parseISO(preset.endTime);
  const days = daysDiffInclusive(s, e);
  const prevEnd = addDaysUTC(s, -1);
  const prevStart = addDaysUTC(prevEnd, -(days - 1));
  return { startTime: toISO(prevStart), endTime: toISO(prevEnd) };
}

export function prevComparableForGranularity(
  preset: GA4Preset,
  g: Granularity
): GA4Preset {
  // desplazamiento por granularidad, pero en GA4Preset
  const range = presetToRange(preset);
  const prev = derivePrevShifted(range, g);
  return rangeToPreset(prev);
}

/* Conveniencia: desplazar un DateRange en días */
export function shiftRangeByDays(range: DateRange, days: number): DateRange {
  const s = addDaysUTC(parseISO(range.start), days);
  const e = addDaysUTC(parseISO(range.end), days);
  return { start: toISO(s), end: toISO(e) };
}
