import type { Mode } from "@/lib/types";
import { useMemo } from "react";
import type { SeriesRanges, TimeParams } from "./types";

interface UseTimeParamsProps {
  currentPeriod: {
    start: string;
    end: string;
  };
  mode: Mode;
  calculatedGranularity: string;
  startDate: Date;
  endDate: Date;
}

interface UseTimeParamsResult {
  timeParams: TimeParams;
  seriesRanges: SeriesRanges;
}

export function useTimeParams({
  currentPeriod,
}: UseTimeParamsProps): UseTimeParamsResult {
  // Formato legacy para deltas/KPIs
  const timeParams = useMemo<TimeParams>(
    () => ({
      startISO: currentPeriod.start,
      endISO: currentPeriod.end,
    }),
    [currentPeriod]
  );

  // Esta implementación se mantiene simple ya que useSeriesRanges
  // ya está separado en su propio hook
  const seriesRanges = useMemo<SeriesRanges>(
    () => ({
      current: {
        start: currentPeriod.start,
        end: currentPeriod.end,
      },
    }),
    [currentPeriod]
  );

  return {
    timeParams,
    seriesRanges,
  };
}
