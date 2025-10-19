// src/lib/analytics/timeWindows.ts
import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  deriveRangeEndingYesterday,
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
 * ESTÁNDAR: Rango previo con desplazamiento consistente para todas las granularidades.
 * 
 * REGLA DE SHIFT:
 * - d, w, m: shift de -1 día (previous termina 1 día antes de que inicie current)
 * - y: shift de -30 días (para desplazar gráfica 1 punto, no 1 año completo)
 * 
 * DURACIÓN: Misma duración que el período current
 */
export function shiftPrevRange(
  current: DateRange,
  granularity: Granularity
): DateRange {
  const currentStart = parseISO(current.start);
  const currentEnd = parseISO(current.end);

  // SHIFT ESTÁNDAR: Definir cuántos días desplazar según granularidad
  let shiftDays: number;
  
  if (granularity === "y") {
    // Año: shift de 30 días (no 365) para desplazar gráfica 1 punto
    shiftDays = 30;
  } else {
    // d, w, m: shift de 1 día siempre
    shiftDays = 1;
  }

  // Calcular período previo: desplazar todo el rango current según shiftDays
  // Previous = Current desplazado -shiftDays en ambos extremos (start y end)
  const prevEnd = addDaysUTC(currentEnd, -shiftDays);
  const prevStart = addDaysUTC(currentStart, -shiftDays);
  
  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/**
 * ESTÁNDAR: Duración de período por granularidad
 * 
 * @param granularity - La granularidad solicitada
 * @param dayAsWeek - Para granularidad "d": true=7 días (series), false=1 día (KPI/donut)
 */
function getStandardDurationDays(granularity: Granularity, dayAsWeek = false): number {
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
 * ESTÁNDAR: Construye current/previous a partir de query (?start&end o ?end o ninguno)
 * 
 * POLÍTICA:
 *  - start+end: respeta rango custom y calcula previous con shift estándar
 *  - end: preset con duración estándar terminando en `end`
 *  - nada: preset con duración estándar terminando AYER
 * 
 * SHIFT: Usa shiftPrevRange estandarizado (1 día para d/w/m, 30 días para y)
 */
export function computeRangesFromQuery(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  dayAsWeek = false
): { current: DateRange; previous: DateRange } {
  if (startQ && endQ) {
    const s = parseISO(startQ);
    const e = parseISO(endQ);
    const current: DateRange = { start: toISO(s), end: toISO(e) };
    const previous = shiftPrevRange(current, g);
    return { current, previous };
  }

  if (endQ) {
    const base = parseISO(endQ);

    // Crear rango current con duración estándar terminando en base
    const currentDuration = getStandardDurationDays(g, dayAsWeek);
    const start = addDaysUTC(base, -(currentDuration - 1));
    const current: DateRange = { start: toISO(start), end: toISO(base) };

    // Usar shiftPrevRange estandarizado para calcular previous
    const previous = shiftPrevRange(current, g);
    return { current, previous };
  }

  // Caso sin parámetros: usar duración estándar terminando ayer
  const current = unwrapRange(
    deriveRangeEndingYesterday(g, todayUTC(), dayAsWeek)
  );
  const previous = shiftPrevRange(current, g);
  return { current, previous };
}

/**
 * HELPERS ESTANDARIZADOS: Para facilitar el uso correcto de computeRangesFromQuery
 */

/** Para KPIs/Donuts: granularidad "d" = 1 día, resto = duración estándar */
export function computeRangesForKPI(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null
): { current: DateRange; previous: DateRange } {
  return computeRangesFromQuery(g, startQ, endQ, false);
}

/** Para Series: granularidad "d" = 7 días, resto = duración estándar */
export function computeRangesForSeries(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null
): { current: DateRange; previous: DateRange } {
  return computeRangesFromQuery(g, startQ, endQ, true);
}

/** Delta % segura: null cuando no hay base (prev <= 0). */
export function computeDeltaPct(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}
