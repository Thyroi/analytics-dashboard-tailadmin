/**
 * /lib/utils/data/seriesForTown.ts
 * Construcción de series temporales para pueblos
 */

import type { Granularity } from "@/lib/types";
import { mapToTemporalSeries } from "./seriesMappers";
import type { GA4Row } from "./types";

/**
 * Construye series temporales para un pueblo específico
 *
 * Similar a buildTimeSeriesForCategory pero para pueblos.
 * Genera dos series (current y previous) con sus totales.
 *
 * @param rows - Filas de datos de GA4
 * @param townMatcher - Función que extrae pueblo de un path
 * @param targetTown - Pueblo objetivo (ej: "almonte", "huelva")
 * @param ranges - Rangos temporales current y previous
 * @param xLabels - Etiquetas del eje X
 * @param granularity - Granularidad temporal
 * @returns Series temporales con totales
 *
 * @example
 * const series = buildTimeSeriesForTown(
 *   ga4Rows,
 *   (path) => detectTown(path),
 *   'almonte',
 *   { current: {...}, previous: {...} },
 *   ['2025-10-01', '2025-10-02', ...],
 *   'd'
 * );
 * // { currentSeries: [200, 250, ...], previousSeries: [180, 220, ...], ... }
 */
export function buildTimeSeriesForTown<T>(
  rows: GA4Row[],
  townMatcher: (path: string) => T | null,
  targetTown: T,
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
    townMatcher,
    targetTown,
    ranges,
    xLabels,
    granularity
  );
}
