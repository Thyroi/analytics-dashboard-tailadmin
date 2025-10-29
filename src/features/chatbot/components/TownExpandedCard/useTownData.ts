import type { DonutDatum } from "@/lib/types";
import { fillMissingDates } from "@/lib/utils/time/fillMissingDates";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
import { useMemo } from "react";
import type {
  TownDataResult,
  UseTownDataParams,
} from "./TownExpandedCard.types";

/**
 * Hook que transforma datos de Level 1 a formato ChartPair
 * - Donut: participación por slice (category)
 * - Line series: agregación temporal con current/previous
 */
export function useTownData({
  level1Data,
  granularity,
  startDate,
  endDate,
}: UseTownDataParams): TownDataResult {
  return useMemo(() => {
    if (!level1Data) {
      return {
        donutData: [],
        lineSeriesData: [],
        lineSeriesPrev: [],
        totalInteractions: 0,
      };
    }

    // Donut: participación por slice (category)
    const donut: DonutDatum[] = level1Data.donutData
      .filter((slice: { value: number }) => slice.value > 0)
      .map(
        (slice: { label: string; value: number }) =>
          ({
            label: slice.label,
            value: slice.value,
            color: undefined,
          } as DonutDatum)
      );

    // Line series CURRENT: usar series agregadas por slice
    const allSeriesCurrent = Object.values(level1Data.seriesBySlice).flat();
    const timeMapCurrent = new Map<string, number>();

    for (const point of allSeriesCurrent) {
      // Convertir YYYYMMDD → YYYY-MM-DD
      const dateLabel = (point as { time: string; value: number }).time.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );
      const current = timeMapCurrent.get(dateLabel) || 0;
      timeMapCurrent.set(
        dateLabel,
        current + (point as { time: string; value: number }).value
      );
    }

    // Materializar serie completa: generar TODAS las fechas del rango
    let lineSeriesCurrent: Array<{ label: string; value: number }> = [];

    if (startDate && endDate) {
      // Convertir YYYYMMDD → YYYY-MM-DD
      const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

      // Generar rango completo con fillMissingDates (reutiliza la lógica)
      lineSeriesCurrent = fillMissingDates(
        Array.from(timeMapCurrent.entries()).map(([label, value]) => ({
          label,
          value,
        })),
        granularity,
        startISO,
        endISO
      );
    } else {
      // Fallback: usar solo datos disponibles
      lineSeriesCurrent = Array.from(timeMapCurrent.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Line series PREVIOUS: procesar level1DataPrevious si existe
    let lineSeriesPrevious: Array<{ label: string; value: number }> = [];

    if (startDate && endDate) {
      // Calcular rango previous usando computeRangesForSeries
      const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const ranges = computeRangesForSeries(granularity, startISO, endISO);

      if (level1Data.raw?.level1DataPrevious) {
        const prevData = level1Data.raw.level1DataPrevious;
        const timeMapPrev = new Map<string, number>();

        // Agregar todas las series del período previo
        for (const [, series] of Object.entries(prevData)) {
          for (const point of series as Array<{
            time: string;
            value: number;
          }>) {
            // Convertir YYYYMMDD → YYYY-MM-DD
            const dateLabel = point.time.replace(
              /(\d{4})(\d{2})(\d{2})/,
              "$1-$2-$3"
            );
            const current = timeMapPrev.get(dateLabel) || 0;
            timeMapPrev.set(dateLabel, current + point.value);
          }
        }

        // Generar rango completo con fillMissingDates
        lineSeriesPrevious = fillMissingDates(
          Array.from(timeMapPrev.entries()).map(([label, value]) => ({
            label,
            value,
          })),
          granularity,
          ranges.previous.start,
          ranges.previous.end
        );
      } else {
        // Si no hay datos previous, crear serie vacía con el rango completo
        lineSeriesPrevious = fillMissingDates(
          [],
          granularity,
          ranges.previous.start,
          ranges.previous.end
        );
      }
    }

    return {
      donutData: donut,
      lineSeriesData: lineSeriesCurrent,
      lineSeriesPrev: lineSeriesPrevious,
      totalInteractions: level1Data.total,
    };
  }, [level1Data, startDate, endDate, granularity]);
}
