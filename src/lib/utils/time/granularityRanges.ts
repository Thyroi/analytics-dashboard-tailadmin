/**
 * /lib/utils/granularityRanges.ts
 * Funciones específicas para calcular rangos por granularidad
 * Cada función tiene comportamiento específico y predecible
 */

import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";

export type DateRange = { start: string; end: string };
export type RangesPair = { current: DateRange; previous: DateRange };

/**
 * GRANULARIDAD DIARIA (d)
 * - Current: Último día (endDate) - SOLO para donuts/KPIs
 * - Previous: Día anterior (endDate - 1)
 *
 * IMPORTANTE: Para SERIES usar computeDailyRangesForSeries() que devuelve 7 días
 */
export function computeDailyRanges(endDate: string): RangesPair {
  const end = parseISO(endDate);

  // Current: último día solamente (para donuts/KPIs)
  const current: DateRange = {
    start: toISO(end),
    end: toISO(end),
  };

  // Previous: día anterior
  const previousDay = addDaysUTC(end, -1);
  const previous: DateRange = {
    start: toISO(previousDay),
    end: toISO(previousDay),
  };

  return { current, previous };
}

/**
 * GRANULARIDAD DIARIA PARA SERIES (d)
 * - Current: Últimos 7 días terminando en endDate
 * - Previous: Misma ventana de 7 días CON SHIFT DE 1 DÍA (mismo comportamiento que semanal)
 *
 * IMPORTANTE: El shift es de 1 DÍA, no 7 días.
 * Si current es Oct 7-13, previous es Oct 6-12 (mismo rango, desplazado 1 día)
 */
export function computeDailyRangesForSeries(endDate: string): RangesPair {
  const end = parseISO(endDate);

  // Current: últimos 7 días
  const currentStart = addDaysUTC(end, -6); // 7 días incluyendo endDate
  const current: DateRange = {
    start: toISO(currentStart),
    end: toISO(end),
  };

  // Previous: SHIFT DE 1 DÍA - misma ventana de 7 días, un día antes
  const previousEnd = addDaysUTC(end, -1); // día anterior al final
  const previousStart = addDaysUTC(currentStart, -1); // día anterior al inicio
  const previous: DateRange = {
    start: toISO(previousStart),
    end: toISO(previousEnd),
  };

  return { current, previous };
}

/**
 * GRANULARIDAD SEMANAL (w)
 * - Current: Últimos 7 días terminando en endDate
 * - Previous: 7 días anteriores CON SHIFT DE 1 DÍA (igual que diaria)
 */
export function computeWeeklyRanges(endDate: string): RangesPair {
  const end = parseISO(endDate);

  // Current: últimos 7 días
  const currentStart = addDaysUTC(end, -6);
  const current: DateRange = {
    start: toISO(currentStart),
    end: toISO(end),
  };

  // Previous: SHIFT DE 1 DÍA - igual que granularidad diaria
  // Si current es 2025-10-05 → 2025-10-11
  // Previous es 2025-10-04 → 2025-10-10
  const previousEnd = addDaysUTC(end, -1); // día anterior al final
  const previousStart = addDaysUTC(currentStart, -1); // día anterior al inicio
  const previous: DateRange = {
    start: toISO(previousStart),
    end: toISO(previousEnd),
  };

  return { current, previous };
}

/**
 * GRANULARIDAD MENSUAL (m)
 * - Current: Últimos 30 días terminando en endDate
 * - Previous: Mismo rango de 30 días CON SHIFT DE 1 DÍA (mismo período, 1 día antes)
 */
export function computeMonthlyRanges(endDate: string): RangesPair {
  const end = parseISO(endDate);

  // Current: últimos 30 días
  const currentStart = addDaysUTC(end, -29); // 30 días incluyendo endDate
  const current: DateRange = {
    start: toISO(currentStart),
    end: toISO(end),
  };

  // Previous: SHIFT DE 1 DÍA - mismo período pero 1 día antes
  // Si current es 2025-10-11 → 2025-09-11 (30 días)
  // Previous es 2025-10-10 → 2025-09-10 (mismo período, 1 día antes)
  const previousEnd = addDaysUTC(end, -1); // día anterior al final
  const previousStart = addDaysUTC(previousEnd, -29); // 30 días incluyendo previousEnd
  const previous: DateRange = {
    start: toISO(previousStart),
    end: toISO(previousEnd),
  };

  return { current, previous };
}

/**
 * GRANULARIDAD ANUAL (y)
 * - Current: Últimos 365 días terminando en endDate
 * - Previous: Mismo rango de 365 días CON SHIFT DE 1 MES (mismo período, 1 mes antes)
 */
export function computeYearlyRanges(endDate: string): RangesPair {
  const end = parseISO(endDate);

  // Current: últimos 365 días
  const currentStart = addDaysUTC(end, -364); // 365 días incluyendo endDate
  const current: DateRange = {
    start: toISO(currentStart),
    end: toISO(end),
  };

  // Previous: SHIFT DE 1 MES - mismo período pero 1 mes antes
  // Si current es 2024-10-12 → 2025-10-12 (365 días)
  // Previous es 2024-09-12 → 2025-09-12 (mismo período, 1 mes antes)
  const previousEnd = new Date(end);
  previousEnd.setUTCMonth(previousEnd.getUTCMonth() - 1); // 1 mes antes

  const previousStart = addDaysUTC(previousEnd, -364); // 365 días incluyendo previousEnd
  const previous: DateRange = {
    start: toISO(previousStart),
    end: toISO(previousEnd),
  };

  return { current, previous };
}

/**
 * FUNCIÓN DISPATCHER - Elige la función correcta según granularidad
 * USA ESTO PARA DONUTS/KPIs (granularidad d = 1 día)
 */
export function computeRangesByGranularity(
  granularity: "d" | "w" | "m" | "y",
  endDate: string
): RangesPair {
  switch (granularity) {
    case "d":
      return computeDailyRanges(endDate);
    case "w":
      return computeWeeklyRanges(endDate);
    case "m":
      return computeMonthlyRanges(endDate);
    case "y":
      return computeYearlyRanges(endDate);
    default:
      throw new Error(`Unsupported granularity: ${granularity}`);
  }
}

/**
 * FUNCIÓN DISPATCHER PARA SERIES - Elige la función correcta según granularidad
 * USA ESTO PARA SERIES/GRÁFICAS (granularidad d = 7 días)
 */
export function computeRangesByGranularityForSeries(
  granularity: "d" | "w" | "m" | "y",
  endDate: string
): RangesPair {
  switch (granularity) {
    case "d":
      return computeDailyRangesForSeries(endDate); // 7 días para series
    case "w":
      return computeWeeklyRanges(endDate);
    case "m":
      return computeMonthlyRanges(endDate);
    case "y":
      return computeYearlyRanges(endDate);
    default:
      throw new Error(`Unsupported granularity: ${granularity}`);
  }
}

/**
 * UTILIDAD PARA DEBUGGING - Muestra información de los rangos
 * Solo en desarrollo
 */
export function debugRanges(_granularity: string, _ranges: RangesPair): void {
  if (process.env.NODE_ENV !== "development") return;

  // Debug logs removed for production cleanliness
  // Ranges can be inspected via debugger if needed
}

/**
 * DETERMINAR GRANULARIDAD AUTOMÁTICA PARA RANGOS PERSONALIZADOS
 * Basado en la duración del rango, determina la granularidad óptima:
 * - <= 31 días: granularidad diaria
 * - 32-90 días (2-3 meses): granularidad semanal
 * - > 90 días: granularidad mensual
 */
export function determineOptimalGranularity(
  startDate: string,
  endDate: string
): "d" | "w" | "m" {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (durationDays <= 31) {
    return "d"; // Hasta 1 mes: granularidad diaria
  } else if (durationDays >= 32 && durationDays <= 90) {
    return "w"; // 2-3 meses: granularidad semanal
  } else {
    return "m"; // Más de 3 meses: granularidad mensual
  }
}

/**
 * RANGOS PERSONALIZADOS PARA DATE PICKER
 * Para rangos personalizados no necesitamos previous, solo current
 * La granularidad se determina automáticamente basada en la duración
 */
export function computeCustomRanges(
  startDate: string,
  endDate: string
): {
  current: DateRange;
  previous: DateRange;
  optimalGranularity: "d" | "w" | "m";
  durationDays: number;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const current: DateRange = {
    start: startDate,
    end: endDate,
  };

  // Para rangos personalizados, el previous será el mismo rango
  // (el frontend puede decidir si quiere comparar con período anterior)
  const previous: DateRange = {
    start: startDate,
    end: endDate,
  };

  const optimalGranularity = determineOptimalGranularity(startDate, endDate);

  return {
    current,
    previous,
    optimalGranularity,
    durationDays,
  };
}
