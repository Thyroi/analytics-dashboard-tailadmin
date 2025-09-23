"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Granularity, DonutDatum } from "@/lib/types";
import type { DevicesOsResponse } from "@/lib/api/analytics";
import { getDevicesOs } from "../services/devicesOs";

type UseDevicesOsOk = {
  data: DevicesOsResponse;
  isLoading: false;
  error: null;
  refetch: () => void;
};
type UseDevicesOsLoading = {
  data: null;
  isLoading: true;
  error: null;
  refetch: () => void;
};
type UseDevicesOsError = {
  data: null;
  isLoading: false;
  error: Error;
  refetch: () => void;
};
export type UseDevicesOsResult = UseDevicesOsOk | UseDevicesOsLoading | UseDevicesOsError;

export function useDevicesOs(input?: {
  start?: string;
  end?: string;
  granularity?: Granularity;
}): UseDevicesOsResult {
  const [data, setData] = useState<DevicesOsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // clave de dependencias estable
  const key = useMemo(
    () => `${input?.start ?? ""}:${input?.end ?? ""}:${input?.granularity ?? ""}`,
    [input?.start, input?.end, input?.granularity]
  );

  const run = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    getDevicesOs({
      start: input?.start,
      end: input?.end,
      granularity: input?.granularity,
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
  }, [input?.start, input?.end, input?.granularity]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (data && !isLoading && !error) return { data, isLoading: false, error: null, refetch: run };
  if (isLoading) return { data: null, isLoading: true, error: null, refetch: run };
  return { data: null, isLoading: false, error: error as Error, refetch: run };
}

// Helper para colorear (sin mutar la respuesta)
export function colorizeOs(items: DonutDatum[]): DonutDatum[] {
  const OS_COLORS: Record<string, string> = {
    Windows: "#00A4EF",
    Android: "#3DDC84",
    iOS: "#A3AAAE",
    Macintosh: "#6E6E73",
    Linux: "#F4C20D",
    "Chrome OS": "#5BB974",
    Other: "#9CA3AF",
  };
  return items.map((d) => ({
    ...d,
    color: d.color ?? OS_COLORS[d.label] ?? "#9CA3AF",
  }));
}
