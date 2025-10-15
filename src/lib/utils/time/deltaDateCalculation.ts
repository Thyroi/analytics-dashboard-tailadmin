import type { Granularity } from "@/lib/types";

/**
 * Calcula las fechas correctas para deltas según la granularidad
 * 
 * Para granularidad 'd' (diaria):
 * - currentDate: ayer (currentDay - 1)  
 * - previousDate: antes de ayer (currentDay - 2)
 * 
 * Para otras granularidades:
 * - Usa las fechas tal como están
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
    // Para granularidad diaria, usar ayer como fecha actual y anteayer como anterior
    const yesterday = new Date(endDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date(endDate);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    return {
      currentEndISO: yesterday.toISOString().split("T")[0],
      previousEndISO: dayBeforeYesterday.toISOString().split("T")[0],
    };
  }
  
  // Para otras granularidades o modo range, usar las fechas tal como están
  return {
    currentEndISO: endDate.toISOString().split("T")[0],
    previousEndISO: endDate.toISOString().split("T")[0],
  };
}