/**
 * /lib/utils/data/seriesMappers.ts
 * Mapeo de datos GA4 a series temporales
 */

import { safeUrlPathname } from "../routing/pathMatching";
import { parseGA4Date } from "./parsers";
import type { GA4Row } from "./types";

/**
 * Mapea datos de GA4 a series temporales con lógica de desplazamiento genérica
 *
 * Soporta comparación de períodos (current vs previous) con desplazamiento temporal
 * para granularidades anuales y diarias.
 *
 * @param rows - Filas de datos de GA4
 * @param categoryMatcher - Función que extrae categoría/pueblo de un path
 * @param targetCategory - Categoría/pueblo objetivo a filtrar
 * @param ranges - Rangos temporales current y previous
 * @param xLabels - Etiquetas del eje X (generadas por generateTimeAxis)
 * @param granularity - Granularidad temporal
 * @returns Series temporales con totales
 */
export function mapToTemporalSeries<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  xLabels: string[],
  granularity: string
): {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
} {
  const currentSeries = new Array(xLabels.length).fill(0);
  const previousSeries = new Array(xLabels.length).fill(0);

  let totalCurrent = 0;
  let totalPrevious = 0;

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Generar timeKey según granularidad
    const timeKey = granularity === "y" ? iso : iso; // Para yearly ya viene como YYYY-MM

    // Mapear a current series
    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      const timeIndex = xLabels.indexOf(timeKey);
      if (timeIndex >= 0) {
        currentSeries[timeIndex] += value;
      }
      totalCurrent += value;
    }

    // Mapear a previous series (NO EXCLUSIVO - una fecha puede estar en ambos)
    if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      if (granularity === "y") {
        // Para yearly, los datos vienen como YYYY-MM y los rangos como YYYY-MM-DD
        // Necesitamos comparar solo año-mes
        const currentStartYM = ranges.current.start.slice(0, 7); // "2024-10"
        const currentEndYM = ranges.current.end.slice(0, 7); // "2025-10"
        const isoYM = iso; // Ya viene como "2025-09"

        // Verificar si este mes está en el current range
        if (isoYM >= currentStartYM && isoYM <= currentEndYM) {
          // Encontrar la posición en xLabels
          const timeIndex = xLabels.indexOf(isoYM);
          if (timeIndex >= 0) {
            // Para previous, ese mismo mes va una posición adelante (shift de 1 mes)
            const targetIndex = timeIndex + 1;
            if (targetIndex < xLabels.length) {
              previousSeries[targetIndex] += value;
            }
          }
        }
      } else {
        // Para otras granularidades, calcular diferencia en días
        const previousStart = new Date(ranges.previous.start);
        const currentDate = new Date(iso);
        const daysFromPrevStart = Math.floor(
          (currentDate.getTime() - previousStart.getTime()) /
            (24 * 60 * 60 * 1000)
        );

        if (daysFromPrevStart >= 0 && daysFromPrevStart < xLabels.length) {
          previousSeries[daysFromPrevStart] += value;
        }
      }

      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
  };
}
