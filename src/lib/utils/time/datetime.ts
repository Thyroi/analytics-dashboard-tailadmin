/**
 * Utilidades de fecha en UTC y presets de rango por granularidad.
 * Consolidación de todas las funciones de datetime duplicadas en el proyecto.
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

/* ==================== Re-exportar funciones de dateRangeWindow ==================== */

// Re-exportar funciones que estaban duplicadas
export {
  deriveAutoRangeForGranularity,
  deriveRangeEndingYesterday,
  endOfMonthUTC,
  endOfYearUTC,
  startOfMonthUTC,
  startOfYearUTC,
} from "./dateRangeWindow";

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
  return new Date(Date.UTC(y, m + n, day));
}

/* ==================== Helpers de formateo ==================== */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function formatMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function formatYearMonth(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}`;
}

/* ==================== Conversión de GA4 dates ==================== */

export function parseGA4Date(yyyymmdd: string, granularity?: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  const iso = `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(
    6,
    8
  )}`;

  if (granularity === "m") {
    // Para granularidad mensual, devolver YYYY-MM
    return iso.slice(0, 7);
  }
  if (granularity === "y") {
    // Para granularidad anual, devolver YYYY
    return iso.slice(0, 4);
  }

  return iso;
}

export function isoFromYYYYMMDD(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(
    6,
    8
  )}`;
}

/* ==================== Presets por granularidad ==================== */

export function getPresetByGranularity(
  granularity: Granularity,
  endISO?: string
): GA4Preset {
  // Si no se especifica endISO, usar AYER como final
  const finalDate = endISO ? parseISO(endISO) : addDaysUTC(todayUTC(), -1);

  let startDate: Date;
  const endDate: Date = finalDate;

  switch (granularity) {
    case "d":
      // Últimos 7 días
      startDate = addDaysUTC(finalDate, -6);
      break;
    case "w":
      // Últimas 4 semanas (28 días)
      startDate = addDaysUTC(finalDate, -27);
      break;
    case "m":
      // Últimos 6 meses
      startDate = addMonthsUTC(finalDate, -5);
      break;
    case "y":
      // Últimos 2 años
      startDate = addMonthsUTC(finalDate, -23);
      break;
    default:
      throw new Error(`Granularidad no soportada: ${granularity}`);
  }

  return {
    startTime: toISO(startDate),
    endTime: toISO(endDate),
  };
}

/* ==================== Validadores de fechas ==================== */

export function isValidISO(iso: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(iso)) return false;

  const date = parseISO(iso);
  return !isNaN(date.getTime()) && toISO(date) === iso;
}

export function isValidYearMonth(ym: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(ym)) return false;

  const [year, month] = ym.split("-").map(Number);
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
}

/* ==================== Rangos de comparación ==================== */

export function getComparisonRanges(
  current: DateRange,
  granularity: Granularity
): { current: DateRange; previous: DateRange } {
  const currentStart = parseISO(current.start);
  const currentEnd = parseISO(current.end);

  // Calcular duración del período actual
  const duration =
    Math.ceil(
      (currentEnd.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;

  let previousStart: Date;
  let previousEnd: Date;

  switch (granularity) {
    case "d":
    case "w":
      // Para días y semanas, retroceder la misma duración
      previousEnd = addDaysUTC(currentStart, -1);
      previousStart = addDaysUTC(previousEnd, -(duration - 1));
      break;
    case "m":
      // Para meses, retroceder por meses
      previousEnd = addMonthsUTC(currentStart, -1);
      previousStart = addMonthsUTC(currentEnd, -duration);
      break;
    case "y":
      // Para años, retroceder por años (12 meses)
      previousEnd = addMonthsUTC(currentStart, -1);
      previousStart = addMonthsUTC(previousEnd, -(duration - 1));
      break;
    default:
      throw new Error(`Granularidad no soportada: ${granularity}`);
  }

  return {
    current,
    previous: {
      start: toISO(previousStart),
      end: toISO(previousEnd),
    },
  };
}
