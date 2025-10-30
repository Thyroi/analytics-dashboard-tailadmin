"use client";

import { useHeaderAnalyticsTimeframe } from "../../context/HeaderAnalyticsTimeContext";
import { ChartContent } from "./ChartContent";
import { LoadingState } from "./LoadingState";
import { useTopPagesChartData } from "./useTopPagesChartData";

export default function TopPagesRangeSection() {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const useExplicit = mode === "range";
  const { categories, series, colorsByName, isLoading } = useTopPagesChartData({
    granularity,
    startISO: useExplicit ? startISO : undefined,
    endISO: useExplicit ? endISO : undefined,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ChartContent
      categories={categories}
      series={series}
      colorsByName={colorsByName}
    />
  );
}
