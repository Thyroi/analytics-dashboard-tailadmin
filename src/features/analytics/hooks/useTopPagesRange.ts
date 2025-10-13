"use client";

import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

import { fetchTopPagesRange } from "@/features/analytics/services/topPagesRange";
import { TopPagesRangePayload } from "@/lib/api/analytics";

export type UseTopPagesRangeParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  top?: number; // default 5
  includeTotal?: boolean; // default true
};

export function useTopPagesRange({
  start,
  end,
  granularity = "d",
  top = 5,
  includeTotal = true,
}: UseTopPagesRangeParams) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["top-pages-range", start, end, granularity, top, includeTotal],
    queryFn: async (): Promise<TopPagesRangePayload> => {
      return fetchTopPagesRange({
        start,
        end,
        granularity,
        top,
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
