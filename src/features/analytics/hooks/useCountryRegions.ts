"use client";

import type { RegionsPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/route";
import { fetchCountryRegions } from "@/features/analytics/services/countryRegions";
import type { Granularity } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

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
  const [data, setData] = useState<RegionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!enabled || !country) return;

    const key = `${country}_${start ?? "auto"}_${
      end ?? "auto"
    }_${granularity}_${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await fetchCountryRegions({
          country,
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
  }, [country, start, end, granularity, limit, enabled]);

  return { data, isLoading, error };
}
