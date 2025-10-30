import type { Granularity, Mode } from "@/lib/types";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
import { useMemo } from "react";

export function useSeriesRanges(
  mode: Mode,
  calculatedGranularity: Granularity,
  startDate: Date,
  endDate: Date
) {
  const seriesRanges = useMemo(
    () =>
      mode === "range"
        ? computeRangesForSeries(
            calculatedGranularity,
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0]
          )
        : computeRangesForSeries(calculatedGranularity),
    [mode, calculatedGranularity, startDate, endDate]
  );

  return seriesRanges;
}
