/**
 * Utilidades de fecha en UTC y presets de rango por granularidad.
 */

import type { Granularity } from "@/lib/types";

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
 * Cantidades configurables por preset:
 *  - Día: 7 días
 *  - Semana: 4 semanas (28 días)
 *  - Mes: últimos 6 meses **completos**
 *  - Año: últimos 2 años **completos**
 */
export const PRESET_DAY_COUNT = 7;
export const PRESET_WEEK_COUNT = 4;
export const PRESET_MONTH_COUNT = 6;
export const PRESET_YEAR_COUNT = 2;

/**
 * Devuelve {startTime, endTime} para la granularidad seleccionada.
 * Reglas:
 *  - "d": últimos 7 días (rolling), hoy incluido.
 *  - "w": últimas 4 semanas (28 días rolling), hoy incluido.
 *  - "m": últimos 6 **meses completos** (hasta el último día del mes previo).
 *  - "y": últimos 2 **años completos** (hasta 31/12 del año previo).
 */
/* ==================== Rango por granularidad (ACTUALIZADO) ==================== */
/**
 * Reglas:
 *  - "d": últimos 7 días (rolling), hoy incluido.
 *  - "w": 28 días (rolling), hoy incluido.
 *  - "m": 30 días rolling (no mes calendario), hoy incluido.
 *  - "y": YTD (01-01 UTC del año vigente) hasta hoy.
 */
export function deriveAutoRangeForGranularity(
  g: Granularity,
  now: Date = todayUTC()
): { startTime: string; endTime: string } {
  if (g === "d") {
    const end = now;
    const start = addDaysUTC(end, -6); // 7 días inclusivos
    return { startTime: toISO(start), endTime: toISO(end) };
  }

  if (g === "w") {
    const end = now;
    const start = addDaysUTC(end, -27); // 28 días inclusivos
    return { startTime: toISO(start), endTime: toISO(end) };
  }

  if (g === "m") {
    const end = now;
    const start = addDaysUTC(end, -29); // 30 días inclusivos
    return { startTime: toISO(start), endTime: toISO(end) };
  }

  // g === "y" -> YTD
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = now;
  return { startTime: toISO(start), endTime: toISO(end) };
}

/* ==================== Rango comparativo desplazado (NUEVO) ==================== */
/**
 * Devuelve el rango inmediatamente anterior desplazado según la granularidad:
 *  - "d": desplaza 1 día (alineación día vs día anterior)
 *  - "w": desplaza 7 días (alineación semana vs semana previa)
 *  - "m": desplaza 30 días (alineación bloque de 30 días vs bloque anterior)
 *  - "y": desplaza 1 año (YTD vs YTD-1)
 */
export function derivePrevShifted(
  current: { startTime: string; endTime: string },
  g: Granularity
): { startTime: string; endTime: string } {
  const s = parseISO(current.startTime);
  const e = parseISO(current.endTime);

  if (g === "y") {
    // Mantener misma longitud desplazando 1 año
    const prevStart = addYearsUTC(s, -1);
    const prevEnd = addYearsUTC(e, -1);
    return { startTime: toISO(prevStart), endTime: toISO(prevEnd) };
  }

  const shiftDays = g === "d" ? 1 : g === "w" ? 7 : 30; // d=1, w=7, m=30
  const prevStart = addDaysUTC(s, -shiftDays);
  const prevEnd = addDaysUTC(e, -shiftDays);
  return { startTime: toISO(prevStart), endTime: toISO(prevEnd) };
}

/* ==================== Compatibilidad (OPCIONAL) ==================== */
/**
 * Si en algún sitio seguís usando `prevComparable(range)` clásico (que hacía “chunk anterior contiguo”),
 * lo dejamos aquí, pero MARCADO como deprecated. Recomendación: migrar a `derivePrevShifted`.
 */
export function prevComparable(range: { startTime: string; endTime: string }): {
  startTime: string;
  endTime: string;
} {
  const s = parseISO(range.startTime);
  const e = parseISO(range.endTime);
  const days = daysDiffInclusive(s, e);
  const prevEnd = addDaysUTC(s, -1);
  const prevStart = addDaysUTC(prevEnd, -(days - 1));
  return { startTime: toISO(prevStart), endTime: toISO(prevEnd) };
}

export function prevComparableForGranularity(
  range: { startTime: string; endTime: string },
  g: Granularity
): { startTime: string; endTime: string } {
  return derivePrevShifted(range, g);
}

export function deriveRangeEndingYesterday(
  g: Granularity,
  now: Date = todayUTC(),
  dayAsWeek: boolean = false
): { startTime: string; endTime: string } {
  const yesterday = addDaysUTC(now, -1);

  if (g === "d") {
    // 1 día (ayer…ayer) o 7 días terminando ayer si dayAsWeek=true
    if (dayAsWeek) {
      const start = addDaysUTC(yesterday, -(7 - 1));
      return { startTime: toISO(start), endTime: toISO(yesterday) };
    }
    return { startTime: toISO(yesterday), endTime: toISO(yesterday) };
  }

  if (g === "w") {
    // 7 días completos hasta ayer
    const start = addDaysUTC(yesterday, -(7 - 1));
    return { startTime: toISO(start), endTime: toISO(yesterday) };
  }

  if (g === "m") {
    // 30 días completos hasta ayer
    const start = addDaysUTC(yesterday, -(30 - 1));
    return { startTime: toISO(start), endTime: toISO(yesterday) };
  }

  // g === "y" → 365 días completos hasta ayer
  const start = addDaysUTC(yesterday, -(365 - 1));
  return { startTime: toISO(start), endTime: toISO(yesterday) };
}

export function prevComparableSameLength(range: {
  startTime: string;
  endTime: string;
}) {
  return prevComparable(range);
}
