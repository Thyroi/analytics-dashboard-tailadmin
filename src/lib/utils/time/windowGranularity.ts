/**
 * Cálculo de Window Granularity basado en duración de rango
 * 
 * Window Granularity: Controla el tamaño de la ventana de datos y bucketing de series.
 * NO es lo mismo que Request Granularity (granularidad del API request).
 * 
 * REGLAS:
 * - Duración ≤ 32 días → 'd' (diaria)
 * - Duración 33-90 días → 'w' (semanal)
 * - Duración > 90 días → 'm' (mensual)
 */

import type { Granularity } from "@/lib/types";
import { parseISO } from "./datetime";

/**
 * Calcula la duración en días entre dos fechas ISO (inclusivo)
 */
export function calculateDurationDays(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 para incluir ambos días
}

/**
 * Determina la window granularity automática basada en duración del rango
 * 
 * @param durationDays - Número de días en el rango (inclusivo)
 * @returns Window granularity: 'd' | 'w' | 'm'
 * 
 * @example
 * calculateWindowGranularity(7)   // 'd' - 1 semana
 * calculateWindowGranularity(45)  // 'w' - 1.5 meses
 * calculateWindowGranularity(120) // 'm' - 4 meses
 * 
 * @remarks
 * Esta función solo calcula window granularity para d/w/m.
 * Granularity 'y' debe ser seleccionada explícitamente por el usuario.
 */
export function calculateWindowGranularity(durationDays: number): Granularity {
  if (durationDays <= 32) {
    return "d"; // Diaria: 1-32 días
  } else if (durationDays <= 90) {
    return "w"; // Semanal: 33-90 días (aprox 1-3 meses)
  } else {
    return "m"; // Mensual: 91+ días (3+ meses)
  }
}

/**
 * Calcula window granularity directamente desde fechas ISO
 * 
 * @param startISO - Fecha inicio en formato YYYY-MM-DD
 * @param endISO - Fecha fin en formato YYYY-MM-DD
 * @returns Window granularity: 'd' | 'w' | 'm'
 * 
 * @example
 * getWindowGranularityFromRange('2025-01-01', '2025-01-31') // 'd'
 * getWindowGranularityFromRange('2025-01-01', '2025-03-15') // 'w'
 * getWindowGranularityFromRange('2025-01-01', '2025-06-30') // 'm'
 */
export function getWindowGranularityFromRange(
  startISO: string,
  endISO: string
): Granularity {
  const duration = calculateDurationDays(startISO, endISO);
  return calculateWindowGranularity(duration);
}
