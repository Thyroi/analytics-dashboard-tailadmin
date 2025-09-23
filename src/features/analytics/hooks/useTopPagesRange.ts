"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import type { TopPagesRangePayload } from "@/lib/utils/analytics";
import { fetchTopPagesRange } from "@/features/analytics/services/topPagesRange";

export type UseTopPagesRangeParams = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  top?: number;           // default 5
  includeTotal?: boolean; // default true
};

export function useTopPagesRange({
  start,
  end,
  granularity = "d",
  top = 5,
  includeTotal = true,
}: UseTopPagesRangeParams) {
  const [data, setData] = useState<TopPagesRangePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef<string>("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetchTopPagesRange({
          start,
          end,
          granularity,
          top,
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
    [start, end, granularity, top, includeTotal]
  );

  useEffect(() => {
    const key = `${start ?? "auto"}_${end ?? "auto"}_${granularity}_top${top}_t${includeTotal ? 1 : 0}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, start, end, granularity, top, includeTotal]);

  const hasData =
    !!data &&
    data.series.length > 0 &&
    data.series.some((s) => s.data.some((v) => v > 0));

  return { data, isLoading, error, hasData, refetch: () => load() };
}
