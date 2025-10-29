import type { Granularity, SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { useMemo } from "react";

type SeriesData = {
  categories: string[];
  currData: number[];
  prevData: number[];
};

export function useEngagementSeries(
  seriesAvgEngagement:
    | { current: SeriesPoint[]; previous: SeriesPoint[] }
    | undefined,
  granularity: Granularity
): SeriesData {
  return useMemo(() => {
    const safeSeries: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: seriesAvgEngagement?.current ?? [],
      previous: seriesAvgEngagement?.previous ?? [],
    };

    const n = Math.min(safeSeries.current.length, safeSeries.previous.length);
    const cur = safeSeries.current.slice(-n);
    const prev = safeSeries.previous.slice(-n);
    const rawCategories = cur.map((p) => p.label);

    return {
      categories: formatChartLabelsSimple(rawCategories, granularity),
      currData: cur.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [seriesAvgEngagement, granularity]);
}
