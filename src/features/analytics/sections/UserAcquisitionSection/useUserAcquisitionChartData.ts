import { useUserAcquisitionRange } from "@/features/analytics/hooks/useUserAcquisitionRange";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { buildSeriesColorMap } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import { FIXED_TOTAL_COLOR } from "./constants";
import type { ChartConfig, LegacyPayload } from "./types";

export function useUserAcquisitionChartData(config: ChartConfig) {
  const { granularity, startISO, endISO } = config;

  const { data, isLoading, error, hasData } = useUserAcquisitionRange({
    start: startISO,
    end: endISO,
    granularity,
    includeTotal: true,
  });

  const rawCategories = useMemo(() => {
    return (
      (data?.categoriesLabels as string[] | undefined) ??
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
    error,
    hasData,
  };
}
