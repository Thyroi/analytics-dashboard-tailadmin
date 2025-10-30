"use client";

import { useHeaderAnalyticsTimeframe } from "../../context/HeaderAnalyticsTimeContext";
import { ChartSectionSkeleton } from "../../skeletons";
import { ChartContent } from "./ChartContent";
import { useUserAcquisitionChartData } from "./useUserAcquisitionChartData";

export default function UserAcquisitionSection() {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const useExplicit = mode === "range";
  const { categories, series, colorsByName, isLoading, error, hasData } =
    useUserAcquisitionChartData({
      granularity,
      startISO: useExplicit ? startISO : undefined,
      endISO: useExplicit ? endISO : undefined,
    });

  if (isLoading) {
    return <ChartSectionSkeleton />;
  }

  return (
    <ChartContent
      categories={categories}
      series={series}
      colorsByName={colorsByName}
      error={error}
      hasData={hasData}
    />
  );
}
