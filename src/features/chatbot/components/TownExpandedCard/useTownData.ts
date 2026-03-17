import type { DonutDatum } from "@/lib/types";
import {
  bucketSeriesPoints,
  buildChartBucketPlan,
} from "@/lib/utils/time/chartBucketing";
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
        chartGranularity: granularity,
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
          }) as DonutDatum,
      );

    // Line series CURRENT: usar series agregadas por slice
    const allSeriesCurrent = Object.values(level1Data.seriesBySlice).flat();
    const timeMapCurrent = new Map<string, number>();

    for (const point of allSeriesCurrent) {
      // Convertir YYYYMMDD → YYYY-MM-DD
      const dateLabel = (point as { time: string; value: number }).time.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3",
      );
      const current = timeMapCurrent.get(dateLabel) || 0;
      timeMapCurrent.set(
        dateLabel,
        current + (point as { time: string; value: number }).value,
      );
    }

    let lineSeriesCurrent: Array<{ label: string; value: number }> = [];
    let chartGranularity = granularity;

    if (startDate && endDate) {
      const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const currentPlan = buildChartBucketPlan(startISO, endISO);
      chartGranularity = currentPlan.bucketGranularity;
      lineSeriesCurrent = bucketSeriesPoints(
        Array.from(timeMapCurrent.entries()).map(([label, value]) => ({
          label,
          value,
        })),
        currentPlan,
      );
    } else {
      lineSeriesCurrent = Array.from(timeMapCurrent.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Line series PREVIOUS: procesar level1DataPrevious si existe
    let lineSeriesPrevious: Array<{ label: string; value: number }> = [];

    if (startDate && endDate) {
      const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      const ranges = computeRangesForSeries(granularity, startISO, endISO);
      const previousPlan = buildChartBucketPlan(
        ranges.previous.start,
        ranges.previous.end,
      );

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
              "$1-$2-$3",
            );
            const current = timeMapPrev.get(dateLabel) || 0;
            timeMapPrev.set(dateLabel, current + point.value);
          }
        }

        lineSeriesPrevious = bucketSeriesPoints(
          Array.from(timeMapPrev.entries()).map(([label, value]) => ({
            label,
            value,
          })),
          previousPlan,
        );
      } else {
        lineSeriesPrevious = previousPlan.buckets.map((bucket) => ({
          label: bucket.label,
          value: 0,
        }));
      }
    }

    return {
      donutData: donut,
      lineSeriesData: lineSeriesCurrent,
      lineSeriesPrev: lineSeriesPrevious,
      chartGranularity,
      totalInteractions: level1Data.total,
    };
  }, [level1Data, startDate, endDate, granularity]);
}
