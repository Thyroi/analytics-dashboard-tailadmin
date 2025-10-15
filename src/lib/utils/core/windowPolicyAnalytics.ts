import type { Granularity } from "@/lib/types";
import { addDaysUTC, parseISO, todayUTC, toISO } from "@/lib/utils/time/datetime";

export type DateRange = { start: string; end: string };

export function deriveRangeEndingYesterday(
  g: Granularity,
  now?: Date
  // dayAsWeek = false // TEMPORALMENTE NO USADO
) {
  // Si no se pasa fecha, usar hoy
  const end = now ?? todayUTC();
  // Termina ayer
  const endDate = addDaysUTC(end, -1);
  let startDate: Date;
  if (g === "d") {
    // Últimos 7 días (terminando ayer)
    startDate = addDaysUTC(endDate, -6);
  } else if (g === "w") {
    // Última semana completa
    startDate = addDaysUTC(endDate, -6);
  } else if (g === "m") {
    // Último mes completo
    startDate = addDaysUTC(endDate, -29);
  } else if (g === "y") {
    // Últimos 12 meses
    startDate = addDaysUTC(endDate, -364);
  } else {
    startDate = addDaysUTC(endDate, -6);
  }
  return {
    startTime: toISO(startDate),
    endTime: toISO(endDate),
  };
}

export function shiftRangeByDays(range: DateRange, days: number): DateRange {
  const s = addDaysUTC(parseISO(range.start), days);
  const e = addDaysUTC(parseISO(range.end), days);
  return { start: toISO(s), end: toISO(e) };
}

export function getDonutWindow(g: Granularity, current: DateRange) {
  // Si granularidad es día, solo el último día; si no, el rango actual
  return g === "d" ? { start: current.end, end: current.end } : current;
}

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
