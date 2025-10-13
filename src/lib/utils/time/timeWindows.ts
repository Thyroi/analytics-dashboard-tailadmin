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

/** Rango previo con desplazamiento NO SUPERPUESTO (períodos consecutivos), manteniendo shape {start,end}. */
export function shiftPrevRange(
  current: DateRange,
  granularity: Granularity
): DateRange {
  const currentStart = parseISO(current.start);
  const currentEnd = parseISO(current.end);

  // Calcular la duración del período actual
  const durationDays =
    Math.ceil(
      (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  if (granularity === "y") {
    // Para granularidad anual: período anterior de la misma duración, terminando 1 día antes del inicio actual
    const prevEnd = addDaysUTC(currentStart, -1);
    const prevStart = addDaysUTC(prevEnd, -(durationDays - 1));
    return {
      start: toISO(prevStart),
      end: toISO(prevEnd),
    };
  } else if (granularity === "m") {
    // Para granularidad mensual: período anterior de la misma duración, terminando 1 día antes del inicio actual
    const prevEnd = addDaysUTC(currentStart, -1);
    const prevStart = addDaysUTC(prevEnd, -(durationDays - 1));
    return {
      start: toISO(prevStart),
      end: toISO(prevEnd),
    };
  }

  // Para otras granularidades (d, w): período anterior de la misma duración, terminando 1 día antes del inicio actual
  const prevEnd = addDaysUTC(currentStart, -1);
  const prevStart = addDaysUTC(prevEnd, -(durationDays - 1));
  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/**
 * Construye current/previous a partir de query (?start&end o ?end o ninguno),
 * aplicando la política:
 *  - start+end: respeta rango y calcula previous con desplazamiento
 *  - end: preset terminando en `end`
 *  - nada: preset terminando AYER
 *
 * IMPORTANTE: Para granularidad "d", usa ventana de 7 días para que las gráficas sean útiles
 */
export function computeRangesFromQuery(
  g: Granularity,
  startQ?: string | null,
  endQ?: string | null
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

    // Cuando se especifica endDate, el rango debe terminar en ese día, no en "yesterday"
    // Recalcular el rango usando el endDate como final
    let current: DateRange;

    if (g === "d") {
      // Para granularidad diaria: solo el último día (para comparar día -1 vs día -2)
      current = { start: toISO(base), end: toISO(base) };
    } else if (g === "w") {
      // Para granularidad semanal: última semana completa (7 días)
      const start = addDaysUTC(base, -(7 - 1)); // 7 días hacia atrás
      current = { start: toISO(start), end: toISO(base) };
    } else if (g === "m") {
      const start = addDaysUTC(base, -(30 - 1)); // 30 días hacia atrás
      current = { start: toISO(start), end: toISO(base) };
    } else {
      // g === "y"
      const start = addDaysUTC(base, -(365 - 1)); // 365 días hacia atrás
      current = { start: toISO(start), end: toISO(base) };
    }

    const previous = shiftPrevRange(current, g);
    return { current, previous };
  }

  // Para granularidad diaria, usar ventana de 7 días para gráficas útiles
  const dayAsWeek = g === "d";
  const current = unwrapRange(
    deriveRangeEndingYesterday(g, todayUTC(), dayAsWeek)
  );
  const previous = shiftPrevRange(current, g);
  return { current, previous };
}

/** Delta % segura: null cuando no hay base (prev <= 0). */
export function computeDeltaPct(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}
