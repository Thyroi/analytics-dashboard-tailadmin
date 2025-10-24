/**
 * Helpers para conversión de granularidades entre ventanas de visualización y requests a APIs
 *
 * PR #5: Separación clara de WindowGranularity (UI) vs RequestGranularity (API)
 */

import type { RequestGranularity, WindowGranularity } from "@/lib/types";

/**
 * Determina la granularidad óptima de visualización basada en la duración del rango
 *
 * @param durationDays - Número de días en el rango (inclusivo)
 * @returns WindowGranularity apropiada para visualización
 *
 * @example
 * determineVisualizationGranularityByDuration(1)   // "d" - 1 día
 * determineVisualizationGranularityByDuration(7)   // "d" - 7 días
 * determineVisualizationGranularityByDuration(14)  // "w" - 2 semanas
 * determineVisualizationGranularityByDuration(60)  // "m" - 2 meses
 * determineVisualizationGranularityByDuration(400) // "y" - más de 1 año
 *
 * @remarks
 * Reglas heurísticas:
 * - <= 10 días: usar "d" (diario)
 * - 11-45 días: usar "w" (semanal)
 * - 46-180 días: usar "m" (mensual)
 * - > 180 días: usar "y" (anual)
 */
export function determineVisualizationGranularityByDuration(
  durationDays: number
): WindowGranularity {
  if (durationDays <= 10) {
    return "d";
  }

  if (durationDays <= 45) {
    return "w";
  }

  if (durationDays <= 180) {
    return "m";
  }

  return "y";
}

/**
 * Convierte una granularidad de ventana a granularidad de request para APIs externas
 *
 * @param windowGranularity - Granularidad de la ventana de visualización
 * @param options - Configuración del target API
 * @param options.target - API destino: "chatbot" o "ga4"
 * @returns RequestGranularity apropiada para el API ("d" o "y")
 *
 * @example
 * // Chatbot siempre usa "d" (granularidad diaria)
 * toRequestGranularity("d", { target: "chatbot" }) // "d"
 * toRequestGranularity("w", { target: "chatbot" }) // "d"
 * toRequestGranularity("m", { target: "chatbot" }) // "d"
 * toRequestGranularity("y", { target: "chatbot" }) // "d"
 *
 * // GA4 usa "y" solo si la ventana es anual, sino "d"
 * toRequestGranularity("d", { target: "ga4" }) // "d"
 * toRequestGranularity("w", { target: "ga4" }) // "d"
 * toRequestGranularity("m", { target: "ga4" }) // "d"
 * toRequestGranularity("y", { target: "ga4" }) // "y"
 *
 * @remarks
 * Política de conversión:
 * - **Chatbot**: Siempre devuelve "d" porque el chatbot trabaja con datos diarios
 *   y los agrupa en memoria según la granularidad de ventana
 * - **GA4**: Devuelve "y" solo si windowGranularity === "y", sino "d"
 *   GA4 solo soporta dimensión "date" (diaria) o "year" (anual)
 */
export function toRequestGranularity(
  windowGranularity: WindowGranularity,
  options: { target: "chatbot" | "ga4" }
): RequestGranularity {
  const { target } = options;

  // Chatbot siempre usa granularidad diaria
  if (target === "chatbot") {
    return "d";
  }

  // GA4: solo "y" si la ventana es anual, sino "d"
  if (target === "ga4") {
    return windowGranularity === "y" ? "y" : "d";
  }

  // Fallback (nunca debería llegar aquí con TypeScript estricto)
  return "d";
}
