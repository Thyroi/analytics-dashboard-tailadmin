import { useTopPagesRange } from "@/features/analytics/hooks/useTopPagesRange";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { buildSeriesColorMap } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import { FIXED_TOTAL_COLOR, TOP_PAGES_COUNT } from "./constants";
import type { ChartConfig, LegacyPayload } from "./types";

export function useTopPagesChartData(config: ChartConfig) {
  const { granularity, startISO, endISO } = config;

  const { data, isLoading } = useTopPagesRange({
    start: startISO,
    end: endISO,
    granularity,
    top: TOP_PAGES_COUNT,
    includeTotal: true,
  });

  const rawCategories = useMemo(() => {
    return (
      data?.xLabels ??
      (data as unknown as LegacyPayload | null)?.categoriesLabels ??
      []
    );
  }, [data]);

  const categories = useMemo(
    () => formatChartLabelsSimple(rawCategories, granularity),
    [rawCategories, granularity]
  );

  const series = useMemo(() => data?.series ?? [], [data?.series]);

  const colorsByName = useMemo(() => {
    const seriesNames = series.map((s) => s.name);
    return buildSeriesColorMap(seriesNames, { Total: FIXED_TOTAL_COLOR });
  }, [series]);

  return {
    categories,
    series,
    colorsByName,
    isLoading,
  };
}
