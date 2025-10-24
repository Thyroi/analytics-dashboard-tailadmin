// src/lib/analytics/timeWindows.ts
import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  parseISO,
  todayUTC,
  toISO,
} from "@/lib/utils/time/datetime";

/** Rango canónico usado en api: YYYY-MM-DD */
export type DateRange = { start: string; end: string };

/** Algunos helpers legacy devuelven {startTime,endTime}. Lo des-normalizamos aquí. */
export type MaybeLegacyRange =
  | { start: string; end: string }
  | { startTime: string; endTime: string };

export function unwrapRange(r: MaybeLegacyRange): DateRange {
  if ("start" in r && "end" in r) return { start: r.start, end: r.end };
  return {
    start: (r as { startTime: string }).startTime,
    end: (r as { endTime: string }).endTime,
  };
}

/**
 * Calcula la duración en días entre dos fechas ISO (inclusivo)
 *
 * @param startISO - Fecha de inicio en formato YYYY-MM-DD
 * @param endISO - Fecha de fin en formato YYYY-MM-DD
 * @returns Número de días entre las fechas (inclusivo, mínimo 1)
 *
 * @example
 * durationDaysBetween("2024-01-01", "2024-01-01") // 1 día
 * durationDaysBetween("2024-01-01", "2024-01-07") // 7 días
 */
export function durationDaysBetween(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Inclusivo: mismo día = 1 día
}

/**
 * Calcula el rango anterior del mismo tamaño, contiguo al rango actual
 *
 * POLÍTICA:
 * - Previous termina exactamente 1 día antes de que inicie current
 * - Previous tiene la misma duración que current (ventana contigua)
 * - NO hay shifts especiales por granularidad
 *
 * @param current - Rango actual
 * @returns Rango anterior del mismo tamaño
 *
 * @example
 * // Current: 2024-01-05 a 2024-01-11 (7 días)
 * // Previous: 2024-12-29 a 2024-01-04 (7 días, termina 1 día antes)
 * calculatePreviousRange({ start: "2024-01-05", end: "2024-01-11" })
 */
function calculatePreviousRange(current: DateRange): DateRange {
  const currentStart = parseISO(current.start);
  const duration = durationDaysBetween(current.start, current.end);

  // Previous termina 1 día antes de current.start
  const prevEnd = addDaysUTC(currentStart, -1);
  // Previous start = prevEnd - (duration - 1)
  const prevStart = addDaysUTC(prevEnd, -(duration - 1));

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/**
 * Duración de período estándar por granularidad
 *
 * @param granularity - La granularidad solicitada
 * @param dayAsWeek - Para granularidad "d": true=7 días (series), false=1 día (KPI/donut)
 */
function getStandardDurationDays(
  granularity: Granularity,
  dayAsWeek = false
): number {
  switch (granularity) {
    case "d":
      return dayAsWeek ? 7 : 1; // Series: 7 días, KPI/Donut: 1 día
    case "w":
      return 7;
    case "m":
      return 30;
    case "y":
      return 365;
    default:
      return 1;
  }
}

/**
 * Construye preset de rango terminando en yesterday (hoy - 1 día) con duración estándar
 *
 * @param g - Granularidad
 * @param dayAsWeek - Para granularidad "d": true=7 días (series), false=1 día (KPI/donut)
 */
function getPresetRange(g: Granularity, dayAsWeek = false): DateRange {
  const today = todayUTC();
  const end = addDaysUTC(today, -1); // Yesterday UTC
  const duration = getStandardDurationDays(g, dayAsWeek);

  // Para todas las granularidades, usar addDaysUTC
  const start = addDaysUTC(end, -(duration - 1));

  return {
    start: toISO(start),
    end: toISO(end),
  };
}

/**
 * ESTÁNDAR: Construye current/previous a partir de query (?start&end o ?end o ninguno)
 *
 * POLÍTICA DE CLAMP:
 *  - startISO+endISO: Respeta rango custom (DatePicker ya clampó a yesterday)
 *  - Solo endISO: Preset con duración estándar terminando en `endISO`
 *  - Ninguno: Preset terminando en yesterday (hoy - 1 día UTC)
 *
 * PREVIOUS RANGE:
 *  - Ventana contigua del mismo tamaño que current
 *  - Termina exactamente 1 día antes de que inicie current
 *  - NO hay shifts especiales por granularidad (year antes era -30 días)
 *
 * @param g - Granularidad de la ventana
 * @param startQ - Fecha de inicio custom (YYYY-MM-DD)
 * @param endQ - Fecha de fin custom (YYYY-MM-DD)
 * @param dayAsWeek - Para granularidad "d": true=7 días (series), false=1 día (KPI/donut)
 *
 * @example
 * // Sin parámetros: preset terminando ayer
 * computeRangesFromQuery("w") // 7 días terminando ayer
 * // -> current: { start: "2024-10-17", end: "2024-10-23" }
 * // -> previous: { start: "2024-10-10", end: "2024-10-16" } (7 días contiguo)
 *
 * @example
 * // Con rango custom: respeta fechas (ya clampadas por DatePicker)
 * computeRangesFromQuery("w", "2024-01-01", "2024-01-15")
 * // -> current: { start: "2024-01-01", end: "2024-01-15" } (15 días)
 * // -> previous: { start: "2023-12-17", end: "2023-12-31" } (15 días contiguo)
 *
 * @example
 * // Solo end: preset terminando en end
 * computeRangesFromQuery("w", null, "2024-01-15")
 * // -> current: { start: "2024-01-09", end: "2024-01-15" } (7 días)
 * // -> previous: { start: "2024-01-02", end: "2024-01-08" } (7 días contiguo)
 */
export function computeRangesFromQuery(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  dayAsWeek = false
): { current: DateRange; previous: DateRange } {
  let current: DateRange;

  // Caso 1: Rango custom completo (start+end)
  if (startQ && endQ) {
    // Respetar fechas sin modificar (DatePicker ya clampó a yesterday)
    current = { start: startQ, end: endQ };
  }
  // Caso 2: Solo end (preset terminando en end)
  else if (endQ) {
    const base = parseISO(endQ);
    const duration = getStandardDurationDays(g, dayAsWeek);
    const start = addDaysUTC(base, -(duration - 1));
    current = { start: toISO(start), end: toISO(base) };
  }
  // Caso 3: Sin parámetros (preset terminando en yesterday)
  else {
    current = getPresetRange(g, dayAsWeek);
  }

  // Previous: Ventana contigua del mismo tamaño
  const previous = calculatePreviousRange(current);

  return { current, previous };
}

/**
 * ==================== HELPERS ESTANDARIZADOS ====================
 */

/**
 * Para KPIs/Donuts/Deltas: granularidad "d" = 1 día, resto = duración estándar
 *
 * COMPORTAMIENTO:
 * - Granularidad "d": 1 día (ayer vs anteayer)
 * - Granularidad "w": 7 días
 * - Granularidad "m": 30 días
 * - Granularidad "y": 365 días
 *
 * PREVIOUS: Ventana contigua del mismo tamaño (sin shifts especiales)
 *
 * @param g - Granularidad
 * @param startQ - Fecha de inicio custom (YYYY-MM-DD)
 * @param endQ - Fecha de fin custom (YYYY-MM-DD)
 *
 * @example
 * // KPI con granularidad día: ayer vs anteayer
 * computeRangesForKPI("d")
 * // -> current: { start: "2024-10-23", end: "2024-10-23" } (1 día)
 * // -> previous: { start: "2024-10-22", end: "2024-10-22" } (1 día)
 *
 * @example
 * // KPI con granularidad semana: última semana vs anterior
 * computeRangesForKPI("w")
 * // -> current: { start: "2024-10-17", end: "2024-10-23" } (7 días)
 * // -> previous: { start: "2024-10-10", end: "2024-10-16" } (7 días contiguo)
 *
 * @example
 * // KPI con rango custom
 * computeRangesForKPI("m", "2024-01-01", "2024-01-31")
 * // -> current: { start: "2024-01-01", end: "2024-01-31" } (31 días)
 * // -> previous: { start: "2023-12-01", end: "2023-12-31" } (31 días contiguo)
 */
export function computeRangesForKPI(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null
): { current: DateRange; previous: DateRange } {
  return computeRangesFromQuery(g, startQ, endQ, false);
}

/**
 * Para Series/Gráficos: granularidad "d" = 7 días, resto = duración estándar
 *
 * COMPORTAMIENTO:
 * - Granularidad "d": 7 días (para gráficas útiles)
 * - Granularidad "w": 7 días
 * - Granularidad "m": 30 días
 * - Granularidad "y": 365 días
 *
 * PREVIOUS: Ventana contigua del mismo tamaño (sin shifts especiales)
 *
 * @param g - Granularidad
 * @param startQ - Fecha de inicio custom (YYYY-MM-DD)
 * @param endQ - Fecha de fin custom (YYYY-MM-DD)
 *
 * @example
 * // Serie con granularidad día: 7 días para gráfica útil
 * computeRangesForSeries("d")
 * // -> current: { start: "2024-10-17", end: "2024-10-23" } (7 días)
 * // -> previous: { start: "2024-10-10", end: "2024-10-16" } (7 días contiguo)
 *
 * @example
 * // Serie con rango custom
 * computeRangesForSeries("w", "2024-01-01", "2024-01-31")
 * // -> current: { start: "2024-01-01", end: "2024-01-31" } (31 días)
 * // -> previous: { start: "2023-12-01", end: "2023-12-31" } (31 días contiguo)
 */
export function computeRangesForSeries(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null
): { current: DateRange; previous: DateRange } {
  return computeRangesFromQuery(g, startQ, endQ, true);
}

/**
 * Delta % calculado directamente: null solo cuando no hay base (prev <= 0).
 * Los datos son los datos, sin restricciones artificiales.
 */
export function computeDeltaPct(curr: number, prev: number): number | null {
  // Si no hay datos previos, no podemos calcular delta
  if (prev <= 0) return null;

  const delta = ((curr - prev) / prev) * 100;

  return delta;
}
