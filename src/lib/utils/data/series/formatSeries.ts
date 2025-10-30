/**
 * Formateo básico de series temporales
 */

import type { Granularity } from "@/lib/types";
import { generateTimeAxis } from "../timeAxis";

/**
 * Formatea series numéricas a formato de respuesta API
 *
 * @param currentSeries - Array de valores para el período actual
 * @param previousSeries - Array de valores para el período anterior
 * @param xLabels - Etiquetas del eje X (para current)
 * @param ranges - Rangos temporales (opcional, para generar labels de previous)
 * @param granularity - Granularidad temporal (opcional)
 * @returns Objeto con series formateadas { current, previous }
 *
 * @example
 * const formatted = formatSeries(
 *   [100, 150, 200],
 *   [80, 120, 180],
 *   ['2025-10-01', '2025-10-02', '2025-10-03']
 * );
 * // { current: [{ label: '2025-10-01', value: 100 }, ...], previous: [...] }
 */
export function formatSeries(
  currentSeries: number[],
  previousSeries: number[],
  xLabels: string[],
  ranges?: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  granularity?: string
): {
  current: Array<{ label: string; value: number }>;
  previous: Array<{ label: string; value: number }>;
} {
  // Generar etiquetas para previous series si se proporcionan los rangos
  let previousLabels = xLabels;

  if (ranges && granularity) {
    previousLabels = generateTimeAxis(
      granularity as Granularity,
      ranges.previous.start,
      ranges.previous.end
    );
  }

  return {
    current: currentSeries.map((value, i) => ({
      label: xLabels[i],
      value,
    })),
    previous: previousSeries.map((value, i) => ({
      label: previousLabels[i] || xLabels[i], // fallback a current labels si no hay previous
      value,
    })),
  };
}
