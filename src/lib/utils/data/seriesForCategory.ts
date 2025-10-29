/**
 * /lib/utils/data/seriesForCategory.ts
 * Construcción de series temporales para categorías
 */

import type { Granularity } from "@/lib/types";
import { mapToTemporalSeries } from "./seriesMappers";
import type { GA4Row } from "./types";

/**
 * Construye series temporales para una categoría específica
 *
 * Genera dos series (current y previous) con sus totales, útil para
 * comparaciones de períodos en gráficos de líneas.
 *
 * @param rows - Filas de datos de GA4
 * @param categoryMatcher - Función que extrae categoría de un path
 * @param targetCategory - Categoría objetivo (ej: "playas", "naturaleza")
 * @param ranges - Rangos temporales current y previous
 * @param xLabels - Etiquetas del eje X
 * @param granularity - Granularidad temporal
 * @returns Series temporales con totales
 *
 * @example
 * const series = buildTimeSeriesForCategory(
 *   ga4Rows,
 *   (path) => detectCategory(path),
 *   'playas',
 *   { current: {...}, previous: {...} },
 *   ['2025-10-01', '2025-10-02', ...],
 *   'd'
 * );
 * // { currentSeries: [100, 150, ...], previousSeries: [80, 120, ...], ... }
 */
export function buildTimeSeriesForCategory<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  xLabels: string[],
  granularity: Granularity
): {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
} {
  return mapToTemporalSeries(
    rows,
    categoryMatcher,
    targetCategory,
    ranges,
    xLabels,
    granularity
  );
}
