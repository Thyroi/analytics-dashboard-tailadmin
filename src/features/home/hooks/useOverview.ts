"use client";

import { getOverview } from "@/features/home/services/overview";
import type { OverviewResponse } from "@/lib/api/analytics";
import type { Granularity, SliceName } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export function useOverview(
  slice: SliceName,
  granularity: Granularity,
  startTime: string,
  endTime: string
): UseOverviewResult {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const depsKey = useMemo(
    () => `${slice}:${granularity}:${startTime}:${endTime}`,
    [slice, granularity, startTime, endTime]
  );

  const run = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    getOverview({
      granularity,
      range: { startTime, endTime },
      signal: ac.signal,
    })
      .then((res) => {
        if (ac.signal.aborted) return;
        setData({
          ...res,
          meta: {
            ...res.meta,
            source: "wpideanto",
          },
        });
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setIsLoading(false);
      });
  }, [granularity, startTime, endTime]); // Removed 'slice' as it's not actually used in the dependency

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
