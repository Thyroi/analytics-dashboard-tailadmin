/**
 * /lib/utils/data/formatters.ts
 * Formateo de series y funciones especializadas para chatbot
 *
 * Este módulo orquesta el procesamiento de datos del chatbot usando
 * procesadores especializados por tipo de focus (category/town)
 */

import type { Granularity } from "@/lib/types";
import { processCategoryFocus } from "../chatbot/processCategoryFocus";
import { processTownFocus } from "../chatbot/processTownFocus";

// Re-export formatSeries para mantener compatibilidad
export { formatSeries } from "./series/formatSeries";

/**
 * Construye series temporales y datos de donut enfocados en una categoría o pueblo específico
 *
 * Procesa datos del chatbot filtrando por category o town según el tipo de focus.
 * Genera series temporales para períodos current/previous y datos agregados para donut (KPI).
 *
 * @param config - Configuración con granularidad, rangos y tipo de focus
 * @param inputData - Datos raw del chatbot en formato ApiResponse
 * @returns Series temporales y datos de donut procesados
 *
 * @example
 * const result = buildSeriesAndDonutFocused(
 *   {
 *     granularity: 'd',
 *     currentRange: { start: '2025-10-01', end: '2025-10-07' },
 *     prevRange: { start: '2025-09-24', end: '2025-09-30' },
 *     focus: { type: 'category', id: 'playas' }
 *   },
 *   chatbotApiResponse
 * );
 * // { series: { current: [...], previous: [...] }, donutData: [...] }
 */
export function buildSeriesAndDonutFocused(
  config: {
    granularity: Granularity;
    currentRange: { start: string; end: string };
    prevRange: { start: string; end: string };
    focus: { type: "category" | "town"; id: string };
  },
  inputData: Record<string, unknown> | null
): {
  series: {
    current: Array<{ label: string; value: number }>;
    previous: Array<{ label: string; value: number }>;
  };
  donutData: Array<{ label: string; value: number }>;
} {
  const { focus } = config;

  if (focus.type === "category") {
    return processCategoryFocus(
      {
        granularity: config.granularity,
        currentRange: config.currentRange,
        prevRange: config.prevRange,
        categoryId: focus.id,
      },
      inputData
    );
  }

  if (focus.type === "town") {
    return processTownFocus(
      {
        granularity: config.granularity,
        currentRange: config.currentRange,
        prevRange: config.prevRange,
        townId: focus.id,
      },
      inputData
    );
  }

  // Fallback
  return {
    series: {
      current: [],
      previous: [],
    },
    donutData: [],
  };
}
