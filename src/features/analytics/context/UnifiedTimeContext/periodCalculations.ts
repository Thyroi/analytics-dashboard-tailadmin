import type { Granularity } from "@/lib/types";
import { addDaysUTC, toISO } from "@/lib/utils/time/datetime";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import type { Mode } from "./types";

export function getCurrentPeriod(startDate: Date, endDate: Date) {
  return {
    start: toISO(startDate),
    end: toISO(endDate),
  };
}

export function getPreviousPeriod(startDate: Date, endDate: Date) {
  const current = getCurrentPeriod(startDate, endDate);
  try {
    const calculation = calculatePreviousPeriodAndGranularity(
      current.start,
      current.end
    );
    return calculation.prevRange;
  } catch {
    // Fallback: día anterior (UTC)
    const fallbackDate = addDaysUTC(startDate, -1);
    const fallbackStr = toISO(fallbackDate);
    return { start: fallbackStr, end: fallbackStr };
  }
}

export function getCalculatedGranularity(
  mode: Mode,
  granularity: Granularity,
  startDate: Date,
  endDate: Date
): Granularity {
  if (mode === "granularity") {
    // Para modo granularidad, usar EXACTAMENTE la granularidad que seleccionó el usuario
    // NO hacer correcciones automáticas - respetar la intención del usuario
    return granularity;
  }

  // Modo range: calcular automáticamente según duración
  const current = getCurrentPeriod(startDate, endDate);
  try {
    const calculation = calculatePreviousPeriodAndGranularity(
      current.start,
      current.end
    );
    return calculation.granularity;
  } catch {
    return "d"; // Fallback
  }
}

export function getDurationDays(startDate: Date, endDate: Date): number {
  const current = getCurrentPeriod(startDate, endDate);
  try {
    const calculation = calculatePreviousPeriodAndGranularity(
      current.start,
      current.end
    );
    return calculation.durationDays;
  } catch {
    return 1; // Fallback
  }
}
