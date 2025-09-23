"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { SliceName } from "@/lib/types";
import type { OverviewResponse } from "@/lib/api/analytics";
import { useHomeFilters } from "@/features/home/context/HomeFiltersContext";
import { getOverview } from "@/features/home/services/overview";

type UseOverviewResult =
  | {
      data: OverviewResponse;
      isLoading: false;
      error: null;
      refetch: () => void;
    }
  | {
      data: null;
      isLoading: true;
      error: null;
      refetch: () => void;
    }
  | {
    data: null;
    isLoading: false;
    error: Error;
    refetch: () => void;
  };

/**
 * Hook para obtener el overview (users + interactions) según el slice actual.
 * - Lee granularidad y rango del HomeFiltersContext (por slice).
 * - Llama al service getOverview (normaliza la respuesta del backend).
 */

export function useOverview(slice: SliceName): UseOverviewResult {
  const { users, interactions } = useHomeFilters();
  const cfg = slice === "users" ? users : interactions;

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const depsKey = useMemo(
    () => `${cfg.granularity}:${cfg.range.startTime}:${cfg.range.endTime}`,
    [cfg.granularity, cfg.range.startTime, cfg.range.endTime]
  );

  const run = useCallback(() => {

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    getOverview({
      granularity: cfg.granularity,
      range: { startTime: cfg.range.startTime, endTime: cfg.range.endTime },
      signal: ac.signal,
    })
      .then((res) => {
        if (ac.signal.aborted) return;
        setData(res);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setIsLoading(false);
      });
  }, [cfg.granularity, cfg.range.startTime, cfg.range.endTime]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  if (data && !isLoading && !error) {
    return { data, isLoading: false, error: null, refetch: run };
  }
  if (isLoading) {
    return { data: null, isLoading: true, error: null, refetch: run };
  }
  return { data: null, isLoading: false, error: error as Error, refetch: run };
}

export default useOverview;
