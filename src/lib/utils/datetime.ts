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
export function deriveAutoRangeForGranularity(
  g: Granularity,
  now: Date = todayUTC(),
  opts?: { mode?: "complete" | "rolling" }
): { startTime: string; endTime: string } {
  // 🔁 por defecto, rolling
  const mode = opts?.mode ?? "rolling";

  if (g === "d") {
    const end = now;
    const start = addDaysUTC(end, -(PRESET_DAY_COUNT - 1));
    return { startTime: toISO(start), endTime: toISO(end) };
  }

  if (g === "w") {
    const end = now;
    const totalDays = PRESET_WEEK_COUNT * 7;
    const start = addDaysUTC(end, -(totalDays - 1));
    return { startTime: toISO(start), endTime: toISO(end) };
  }

  if (g === "m") {
    if (mode === "rolling") {
      const end = now; // ← hoy
      const start = addMonthsUTC(end, -6); // ← 6 meses hacia atrás (misma fecha)
      return { startTime: toISO(start), endTime: toISO(end) };
    }
    // meses completos (por si lo necesitas en otro lugar)
    const endMonth = endOfMonthUTC(addMonthsUTC(now, -1));
    const startMonth = startOfMonthUTC(
      addMonthsUTC(endMonth, -(PRESET_MONTH_COUNT - 1))
    );
    return { startTime: toISO(startMonth), endTime: toISO(endMonth) };
  }

  // g === "y"
  if (mode === "rolling") {
    const end = now;
    const start = addYearsUTC(end, -2);
    return { startTime: toISO(start), endTime: toISO(end) };
  }
  const endYear = endOfYearUTC(addYearsUTC(now, -1));
  const startYear = startOfYearUTC(
    addYearsUTC(endYear, -(PRESET_YEAR_COUNT - 1))
  );
  return { startTime: toISO(startYear), endTime: toISO(endYear) };
}
/**
 * Rango comparable inmediatamente anterior (misma longitud).
 */
export function prevComparable(range: { startTime: string; endTime: string }): {
  startTime: string;
  endTime: string;
} {
  const s = parseISO(range.startTime);
  const e = parseISO(range.endTime);
  const days = daysDiffInclusive(s, e);
  const prevEnd = new Date(s.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  return { startTime: toISO(prevStart), endTime: toISO(prevEnd) };
}
