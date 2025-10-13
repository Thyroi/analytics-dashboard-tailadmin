"use client";

import type { RegionsPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/route";
import { fetchCountryRegions } from "@/features/analytics/services/countryRegions";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UseCountryRegionsParams = {
  country: string; // ISO-2
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  limit?: number;
  enabled?: boolean; // lazy fetch al expandir
};

export function useCountryRegions({
  country,
  start,
  end,
  granularity = "d",
  limit = 100,
  enabled = true,
}: UseCountryRegionsParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["country-regions", country, start, end, granularity, limit],
    queryFn: async (): Promise<RegionsPayload> => {
      return fetchCountryRegions({
        country,
        start,
        end,
        granularity,
        limit,
      });
    },
    enabled: enabled && Boolean(country),
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
