// src/features/analytics/hooks/useUserAcquisitionRange.ts
"use client";

import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

import { fetchUserAcquisitionRange } from "@/features/analytics/services/userAcquisitionRange";
import { AcquisitionRangePayload } from "@/lib/api/analytics";

export type UseUserAcquisitionRangeParams = {
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y" (se usa si no pasas start/end)
  includeTotal?: boolean; // default: true
};

export function useUserAcquisitionRange({
  start,
  end,
  granularity = "d",
  includeTotal = true,
}: UseUserAcquisitionRangeParams) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user-acquisition-range", start, end, granularity, includeTotal],
    queryFn: async (): Promise<AcquisitionRangePayload> => {
      return fetchUserAcquisitionRange({
        start,
        end,
        granularity,
        includeTotal,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      if (error instanceof DOMException && error.name === "AbortError")
        return false;
      return failureCount < 2;
    },
  });

  const hasData =
    !!data &&
    data.series.length > 0 &&
    data.series.some((s) => s.data.some((v) => v > 0));

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    hasData,
    refetch,
  };
}
