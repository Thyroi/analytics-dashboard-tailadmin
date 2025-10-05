"use client";

import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Ready = {
  status: "ready";
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  donutData: DonutDatum[];
};
type State =
  | { status: "idle" | "loading" }
  | Ready
  | { status: "error"; message: string };

export function useTownDetails(id: TownId | null, granularity: Granularity) {
  const [state, setState] = useState<State>({ status: "idle" });
  const cacheRef = useRef<Ready | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const hasCache = cacheRef.current !== null;
    if (!hasCache) setIsInitialLoading(true);
    else setIsFetching(true);

    try {
      const r = await fetch(
        `/api/analytics/v1/dimensions/pueblos/${id}/details?g=${granularity}`,
        {
          method: "GET",
          signal: ac.signal,
          headers: { "cache-control": "no-cache" },
        }
      );
      if (ac.signal.aborted) return;
      const raw = await r.json();

      const series = (raw?.series ?? { current: [], previous: [] }) as {
        current: SeriesPoint[];
        previous: SeriesPoint[];
      };
      const donut = (raw?.donutData ?? []) as DonutDatum[];

      const next: Ready = { status: "ready", series, donutData: donut };
      cacheRef.current = next;
      setState(next);
    } catch (err: unknown) {
      if (ac.signal.aborted) return;
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error fetching town details";
      setState({ status: "error", message });
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  }, [id, granularity]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load, id, granularity]);

  const series = useMemo(
    () =>
      state.status === "ready"
        ? state.series
        : cacheRef.current?.series ?? { current: [], previous: [] },
    [state]
  );
  const donutData = useMemo(
    () =>
      state.status === "ready"
        ? state.donutData
        : cacheRef.current?.donutData ?? [],
    [state]
  );

  return {
    state,
    series,
    donutData,
    isInitialLoading,
    isFetching,
    refetch: load,
  };
}
