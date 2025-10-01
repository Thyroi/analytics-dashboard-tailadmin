"use client";

import type { CitiesPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/[region]/cities/route";
import { fetchRegionCities } from "@/features/analytics/services/regionCities";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UseRegionCitiesParams = {
  country: string;
  region: string;
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  limit?: number;
  enabled?: boolean;
};

export function useRegionCities({
  country,
  region,
  start,
  end,
  granularity = "d",
  limit = 100,
  enabled = true,
}: UseRegionCitiesParams) {
  const q = useQuery<CitiesPayload, Error>({
    queryKey: [
      "analytics",
      "cities",
      country,
      region,
      start ?? "auto",
      end ?? "auto",
      granularity,
      limit,
    ] as const,
    queryFn: () =>
      fetchRegionCities({ country, region, start, end, granularity, limit }),
    enabled: Boolean(enabled && country && region),
    // Queremos skeleton inmediato al cambiar de región (sin mantener datos previos)
    placeholderData: undefined,
    // Política de recarga/caché
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: "always",
    retry: 2,
  });

  // Muestra "loading" también cuando hay refetch sin data aún
  const isLoading = q.isPending || (q.isFetching && !q.data);

  return {
    data: q.data ?? null,
    isLoading,
    error: q.error ?? null,
  };
}
