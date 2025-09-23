// src/features/analytics/hooks/useUserAcquisitionRange.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import type { AcquisitionRangePayload } from "@/features/analytics/types";
import { fetchUserAcquisitionRange } from "@/features/analytics/services/userAcquisitionRange";

export type UseUserAcquisitionRangeParams = {
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y" (se usa si no pasas start/end)
  includeTotal?: boolean;    // default: true
};

export function useUserAcquisitionRange({
  start,
  end,
  granularity = "d",
  includeTotal = true,
}: UseUserAcquisitionRangeParams) {
  const [data, setData] = useState<AcquisitionRangePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Evita fetch duplicados con la misma key
  const lastKey = useRef<string>("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetchUserAcquisitionRange({
          start,
          end,
          granularity,
          includeTotal,
          signal,
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
    },
    [start, end, granularity, includeTotal]
  );

  useEffect(() => {
    const key = `${start ?? "auto"}_${end ?? "auto"}_${granularity}_${includeTotal ? 1 : 0}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, start, end, granularity, includeTotal]);

  const hasData =
    !!data &&
    data.series.length > 0 &&
    data.series.some((s) => s.data.some((v) => v > 0));

  return {
    data,
    isLoading,
    error,
    hasData,
    refetch: () => load(),
  };
}
