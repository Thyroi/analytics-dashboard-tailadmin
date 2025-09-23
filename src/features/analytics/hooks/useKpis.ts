"use client";

import { useEffect, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import { fetchKpis } from "@/features/analytics/services/kpis";
import { KpiPayload } from "@/lib/api/analytics";

export type UseKpisParams = {
  start?: string;
  end?: string;
  granularity?: Granularity; // por si quieres auto-range en el endpoint
};

export function useKpis({ start, end, granularity = "d" }: UseKpisParams) {
  const [data, setData] = useState<KpiPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef("");

  useEffect(() => {
    const key = `${start ?? "auto"}_${end ?? "auto"}_${granularity}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const payload = await fetchKpis({ start, end, granularity, signal: controller.signal });
        setData(payload);
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
  }, [start, end, granularity]);

  return { data, isLoading, error };
}
