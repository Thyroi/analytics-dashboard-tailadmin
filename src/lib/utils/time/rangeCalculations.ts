/**
 * Cálculo de rangos de fechas y granularidad automática
 */

import type { Granularity } from "@/lib/types";

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
 * Calcula la duración en días entre dos fechas
 */
function calculateDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Incluir ambos días
}

/**
 * Determina la granularidad automática para VISUALIZACIÓN basada en la duración
 * NOTA: Esta es granularidad de BUCKETS/SERIES, NO granularidad de GA4 requests
 */
function determineVisualizationGranularityByDuration(
  durationDays: number
): Granularity {
  if (durationDays <= 32) {
    return "d"; // día: 1-31 días
  } else if (durationDays <= 90) {
    return "w"; // semana: 32-90 días
  } else {
    return "m"; // mes: 91+ días (incluyendo años, hasta 32 buckets)
  }
}

/**
 * Determina la granularidad de GA4 request basada en la granularidad del UI
 * REGLA: Solo 'y' usa yearMonth dimension, todo lo demás usa date dimension
 */
function determineGA4Granularity(uiGranularity: Granularity): Granularity {
  // Para GA4 requests:
  // - UI granularidades d, w, m → GA4 usa "d" (date dimension)
  // - UI granularidad y → GA4 usa "y" (yearMonth dimension)
  return uiGranularity === "y" ? "y" : "d";
}

/**
 * Calcula el rango anterior del mismo tamaño
 */
function calculatePreviousRange(
  currentStart: string,
  currentEnd: string,
  durationDays: number
): DateRange {
  const startDate = new Date(currentStart);

  // Calcular fechas del período anterior
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1); // Un día antes del current start

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - durationDays + 1); // Mismo número de días

  return {
    start: prevStartDate.toISOString().split("T")[0],
    end: prevEndDate.toISOString().split("T")[0],
  };
}

/**
 * Función principal: calcula período anterior y granularidad automática
 */
export function calculatePreviousPeriodAndGranularity(
  currentStart: string,
  currentEnd: string
): PeriodCalculation {
  // Validaciones
  const startDate = new Date(currentStart);
  const endDate = new Date(currentEnd);

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  if (startDate > new Date()) {
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
  const granularity = determineVisualizationGranularityByDuration(durationDays);

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
 * Exportar utilidades de granularidad
 */
export { determineGA4Granularity, determineVisualizationGranularityByDuration };
