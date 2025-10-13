// features/analytics/hooks/useKpis.ts
"use client";

import { fetchKpis } from "@/features/analytics/services/kpis";
import type { KpiPayload } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UseKpisParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
};

export function useKpis({ start, end, granularity = "d" }: UseKpisParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["kpis", start, end, granularity],
    queryFn: async (): Promise<KpiPayload> => {
      return fetchKpis({ start, end, granularity });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      if (error instanceof DOMException && error.name === "AbortError")
        return false;
      return failureCount < 2;
    },
  });

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
  };
}
