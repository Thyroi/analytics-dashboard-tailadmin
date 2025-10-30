"use client";

import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { useHeaderAnalyticsTimeframe } from "@/features/analytics/context/HeaderAnalyticsTimeContext";
import type { AnalyticsKPISectionProps } from "./types";
import { GRID_COLS_CLASS } from "./constants";
import { useKPIItems } from "./useKPIItems";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

export default function AnalyticsKPISection({
  className = "",
}: AnalyticsKPISectionProps) {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const { items, isLoading, error } = useKPIItems({
    mode,
    startISO,
    endISO,
    granularity,
  });

  if (isLoading || !items) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return <ErrorState message={error.message} className={className} />;
  }

  return (
    <KPIStatGrid
      className={className}
      items={items}
      colsClassName={GRID_COLS_CLASS}
    />
  );
}
