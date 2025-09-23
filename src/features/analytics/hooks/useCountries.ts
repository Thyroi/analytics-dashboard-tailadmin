// src/features/analytics/hooks/useCountries.ts
"use client";

import { useEffect, useRef, useState } from "react";
import type { CountriesPayload } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import { fetchCountries } from "@/features/analytics/services/countries";

export type UseCountriesParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  limit?: number;
};

export function useCountries({ start, end, granularity = "d", limit = 100 }: UseCountriesParams) {
  const [data, setData] = useState<CountriesPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef("");

  useEffect(() => {
    const key = `${start ?? "auto"}_${end ?? "auto"}_${granularity}_${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await fetchCountries({ start, end, granularity, limit, signal: controller.signal });
        setData(resp);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [start, end, granularity, limit]);

  return { data, isLoading, error };
}
