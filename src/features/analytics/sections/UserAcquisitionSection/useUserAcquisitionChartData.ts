import { useUserAcquisitionRange } from "@/features/analytics/hooks/useUserAcquisitionRange";
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
    const source =
      (data?.categoriesLabels as string[] | undefined) ??
      (data as unknown as LegacyPayload | null)?.categoriesLabels ??
      [];

    return Array.isArray(source)
      ? source.map((label) => String(label ?? "").trim())
      : [];
  }, [data]);

  const categories = useMemo(() => {
    const sourceSeries = Array.isArray(data?.series) ? data.series : [];
    const maxSeriesPoints = sourceSeries.reduce((max, item) => {
      const points = Array.isArray(item?.data) ? item.data.length : 0;
      return Math.max(max, points);
    }, 0);

    if (maxSeriesPoints === 0) {
      return rawCategories;
    }

    if (rawCategories.length === maxSeriesPoints) {
      return rawCategories;
    }

    if (rawCategories.length > maxSeriesPoints) {
      return rawCategories.slice(0, maxSeriesPoints);
    }

    const fallback = Array.from({ length: maxSeriesPoints }, (_, index) => {
      const raw = rawCategories[index];
      return raw && raw !== "" ? raw : String(index + 1);
    });

    return fallback;
  }, [data?.series, rawCategories]);

  const series = useMemo(() => {
    const sourceSeries = Array.isArray(data?.series) ? data.series : [];
    const targetLength = categories.length;

    return sourceSeries
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        name: item.name,
        data: Array.from({ length: targetLength }, (_, index) => {
          const value = Number(item.data?.[index] ?? 0);
          return Number.isFinite(value) ? value : 0;
        }),
      }));
  }, [data?.series, categories]);

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
