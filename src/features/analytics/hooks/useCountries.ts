// src/features/analytics/hooks/useCountries.ts
"use client";

import { fetchCountries } from "@/features/analytics/services/countries";
import type { CountriesPayload } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UseCountriesParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  limit?: number;
};

export function useCountries({
  start,
  end,
  granularity = "d",
  limit = 100,
}: UseCountriesParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["countries", start, end, granularity, limit],
    queryFn: async (): Promise<CountriesPayload> => {
      return fetchCountries({ start, end, granularity, limit });
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
