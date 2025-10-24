/**
 * Cálculo de rangos de fechas y granularidad automática
 *
 * ⚠️ MIGRADO A UTC - Usa parseISO, toISO, addDaysUTC en lugar de new Date() y .setDate()
 */

import type { Granularity, WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "./datetime";
import {
  determineVisualizationGranularityByDuration as determineGranularityByDuration,
  toRequestGranularity,
} from "./granularityHelpers";

export type DateRange = {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
};

export type PeriodCalculation = {
  currentRange: DateRange;
  prevRange: DateRange;
  granularity: Granularity;
  durationDays: number;
};

/**
 * Calcula la duración en días entre dos fechas (UTC)
 *
 * ⚠️ Usa parseISO para evitar timezone drift
 */
function calculateDurationDays(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Incluir ambos días
}

/**
 * Determina la granularidad de GA4 request basada en la granularidad del UI
 * REGLA: Solo 'y' usa yearMonth dimension, todo lo demás usa date dimension
 *
 * @deprecated Use toRequestGranularity(uiGranularity, { target: "ga4" }) from granularityHelpers instead
 */
export function determineGA4Granularity(uiGranularity: Granularity): "d" | "y" {
  return toRequestGranularity(uiGranularity as WindowGranularity, {
    target: "ga4",
  });
}

/**
 * Calcula el rango anterior del mismo tamaño (UTC)
 *
 * ⚠️ Usa addDaysUTC en lugar de .setDate() para evitar mutaciones y timezone drift
 */
function calculatePreviousRange(
  currentStart: string,
  currentEnd: string,
  durationDays: number
): DateRange {
  const startDate = parseISO(currentStart);

  // Calcular fechas del período anterior (UTC)
  const prevEndDate = addDaysUTC(startDate, -1); // Un día antes del current start
  const prevStartDate = addDaysUTC(prevEndDate, -(durationDays - 1)); // Mismo número de días

  return {
    start: toISO(prevStartDate),
    end: toISO(prevEndDate),
  };
}

/**
 * Función principal: calcula período anterior y granularidad automática (UTC)
 *
 * ⚠️ Validaciones usan parseISO para evitar timezone drift
 */
export function calculatePreviousPeriodAndGranularity(
  currentStart: string,
  currentEnd: string
): PeriodCalculation {
  // Validaciones (UTC)
  const startDate = parseISO(currentStart);
  const endDate = parseISO(currentEnd);

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  const now = new Date(); // Comparar con now real (no UTC) para validación
  if (startDate > now) {
    throw new Error("Start date cannot be in the future");
  }

  // Calcular duración
  const durationDays = calculateDurationDays(currentStart, currentEnd);

  if (durationDays < 1) {
    throw new Error("Duration must be at least 1 day");
  }

  if (durationDays > 1095) {
    // ~3 años
    throw new Error("Duration cannot exceed 3 years");
  }

  // Determinar granularidad automática para visualización
  const granularity = determineGranularityByDuration(durationDays);

  // Calcular rango anterior
  const prevRange = calculatePreviousRange(
    currentStart,
    currentEnd,
    durationDays
  );

  return {
    currentRange: {
      start: currentStart,
      end: currentEnd,
    },
    prevRange,
    granularity,
    durationDays,
  };
}

/**
 * Versión para casos donde ya tienes granularidad definida
 */
export function calculatePreviousPeriodWithGranularity(
  currentStart: string,
  currentEnd: string,
  granularity: Granularity
): Omit<PeriodCalculation, "granularity"> & { granularity: Granularity } {
  const durationDays = calculateDurationDays(currentStart, currentEnd);
  const prevRange = calculatePreviousRange(
    currentStart,
    currentEnd,
    durationDays
  );

  return {
    currentRange: {
      start: currentStart,
      end: currentEnd,
    },
    prevRange,
    granularity,
    durationDays,
  };
}

/**
 * Solo calcula rangos anterior sin determinar granularidad
 * Útil cuando ya tienes la granularidad definida desde el contexto
 */
export function calculatePreviousPeriodOnly(
  currentStart: string,
  currentEnd: string
): {
  currentRange: DateRange;
  prevRange: DateRange;
  durationDays: number;
} {
  const durationDays = calculateDurationDays(currentStart, currentEnd);
  const prevRange = calculatePreviousRange(
    currentStart,
    currentEnd,
    durationDays
  );

  return {
    currentRange: {
      start: currentStart,
      end: currentEnd,
    },
    prevRange,
    durationDays,
  };
}

/**
 * Re-exportar utilidades de granularidad para compatibilidad
 */
export { determineVisualizationGranularityByDuration } from "./granularityHelpers";
