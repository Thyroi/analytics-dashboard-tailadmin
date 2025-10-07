// features/analytics/hooks/useKpis.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import { fetchKpis } from "@/features/analytics/services/kpis";
import type { KpiPayload } from "@/lib/api/analytics";

export type UseKpisParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
};

export function useKpis({ start, end, granularity = "d" }: UseKpisParams) {
  const [data, setData] = useState<KpiPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef("");

  const key = useMemo(
    () => `${start ?? "auto"}|${end ?? "auto"}|${granularity}`,
    [start, end, granularity]
  );

  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    // DEBUG: log de la request
    const sp = new URLSearchParams();
    if (start) sp.set("start", start);
    if (end) sp.set("end", end);
    if (granularity) sp.set("granularity", granularity);

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
  }, [key, start, end, granularity]);

  return { data, isLoading, error };
}
