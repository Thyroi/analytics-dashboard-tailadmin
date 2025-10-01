"use client";

import type { CitiesPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/[region]/cities/route";
import { fetchRegionCities } from "@/features/analytics/services/regionCities";
import type { Granularity } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export type UseRegionCitiesParams = {
  country: string; // ISO-2
  region: string; // nombre GA4
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  limit?: number;
  enabled?: boolean; // lazy fetch al expandir
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
  const [data, setData] = useState<CitiesPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!enabled || !country || !region) return;

    const key = `${country}_${region}_${start ?? "auto"}_${
      end ?? "auto"
    }_${granularity}_${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await fetchRegionCities({
          country,
          region,
          start,
          end,
          granularity,
          limit,
          signal: controller.signal,
        });
        setData(resp);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setError(e as Error);
          setData(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [country, region, start, end, granularity, limit, enabled]);

  return { data, isLoading, error };
}
