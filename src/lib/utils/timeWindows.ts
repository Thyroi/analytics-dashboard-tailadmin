// src/lib/analytics/timeWindows.ts
import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  addYearsUTC,
  deriveRangeEndingYesterday,
  parseISO,
  todayUTC,
  toISO,
} from "@/lib/utils/datetime";

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

/** Rango previo con **desplazamiento** (solapado), manteniendo shape {start,end}. */
export function shiftPrevRange(current: DateRange, g: Granularity): DateRange {
  if (g === "y") {
    return {
      start: toISO(addYearsUTC(parseISO(current.start), -1)),
      end: toISO(addYearsUTC(parseISO(current.end), -1)),
    };
  }
  const shiftDays = g === "d" ? 1 : g === "w" ? 7 : 30;
  return {
    start: toISO(addDaysUTC(parseISO(current.start), -shiftDays)),
    end: toISO(addDaysUTC(parseISO(current.end), -shiftDays)),
  };
}

/**
 * Construye current/previous a partir de query (?start&end o ?end o ninguno),
 * aplicando la política:
 *  - start+end: respeta rango y calcula previous con desplazamiento
 *  - end: preset terminando en `end`
 *  - nada: preset terminando AYER
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
    const current = unwrapRange(deriveRangeEndingYesterday(g, base));
    const previous = shiftPrevRange(current, g);
    return { current, previous };
  }

  const current = unwrapRange(deriveRangeEndingYesterday(g, todayUTC()));
  const previous = shiftPrevRange(current, g);
  return { current, previous };
}

/** Delta % segura: null cuando no hay base (prev <= 0). */
export function computeDeltaPct(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

/** Utilidad simple para parsear pathname de una URL (o devolver algo razonable). */
export function safeUrlPathname(raw: string): string {
  try {
    const u = new URL(raw);
    return u.pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}
