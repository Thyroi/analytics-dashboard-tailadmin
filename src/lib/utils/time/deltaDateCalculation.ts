import type { Granularity } from "@/lib/types";
import { addDaysUTC, toISO } from "./datetime";

/**
 * Calcula las fechas correctas para deltas según la granularidad (UTC)
 *
 * Para granularidad 'd' (diaria):
 * - currentDate: ayer (currentDay - 1)
 * - previousDate: antes de ayer (currentDay - 2)
 *
 * Para otras granularidades:
 * - Usa las fechas tal como están
 * 
 * ⚠️ MIGRADO A UTC - Usa addDaysUTC y toISO en lugar de .setDate()
 */
export function getCorrectDatesForGranularity(
  endDate: Date,
  granularity: Granularity,
  mode: "range" | "granularity"
): {
  currentEndISO: string;
  previousEndISO: string;
} {
  if (granularity === "d" && mode === "granularity") {
    // Para granularidad diaria, usar ayer como fecha actual y anteayer como anterior (UTC)
    const yesterday = addDaysUTC(endDate, -1);
    const dayBeforeYesterday = addDaysUTC(endDate, -2);

    return {
      currentEndISO: toISO(yesterday),
      previousEndISO: toISO(dayBeforeYesterday),
    };
  }

  // Para otras granularidades o modo range, usar las fechas tal como están
  return {
    currentEndISO: toISO(endDate),
    previousEndISO: toISO(endDate),
  };
}
