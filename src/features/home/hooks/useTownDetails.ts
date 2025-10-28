"use client";

import { useCombinedTownCategoryBreakdown } from "@/features/home/hooks/useCombinedTownCategoryBreakdown";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { useMemo } from "react";

/**
 * Hook simplificado para obtener detalles de un pueblo combinando datos de GA4 y Chatbot.
 * Similar a useCategoryDetails pero para pueblos.
 */
export function useTownDetails(
  townId: TownId,
  granularity: Granularity,
  endISO: string
) {
  const ranges = useMemo(
    () => computeRangesForKPI(granularity, null, endISO),
    [granularity, endISO]
  );

  // Use the combined hook that merges GA4 + Chatbot data
  const result = useCombinedTownCategoryBreakdown(
    townId,
    granularity,
    ranges.current.start,
    ranges.current.end
  );

  return {
    series: result.series,
    donutData: result.donutData,
    isPending: result.isLoading,
    isError: result.isError,
  };
}
