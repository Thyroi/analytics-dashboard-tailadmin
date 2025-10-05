// src/features/home/hooks/useTownsTotals.ts
"use client";

import {
  getTownsTotals,
  type TownsTotalsUIResponse,
  type TownTotalsItem,
} from "@/features/home/services/townsTotals";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type TownDelta = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  /** Puede ser null cuando no hay base de comparación */
  deltaPct: number | null;
};

type ReadyState = {
  status: "ready";
  data: TownsTotalsUIResponse;
  items: TownDelta[];
};
type ErrorState = { status: "error"; message: string };

export function useTownsTotals(granularity: Granularity, endISO?: string) {
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<ReadyState | null>(null);

  const key = useMemo(
    () => `${granularity}|${endISO ?? ""}`,
    [granularity, endISO]
  );

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setError(null);
    const hasCache = cacheRef.current !== null;
    if (!hasCache) {
      setIsInitialLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const res = await getTownsTotals({
        granularity,
        endISO,
        signal: ac.signal,
      });
      if (ac.signal.aborted) return;

      const items: TownDelta[] = res.items.map((it: TownTotalsItem) => ({
        id: it.id,
        currentTotal: Number.isFinite(it.currentTotal) ? it.currentTotal : 0,
        previousTotal: Number.isFinite(it.previousTotal) ? it.previousTotal : 0,
        deltaPct:
          typeof it.deltaPct === "number" && Number.isFinite(it.deltaPct)
            ? it.deltaPct
            : null,
      }));

      const nextReady: ReadyState = { status: "ready", data: res, items };
      cacheRef.current = nextReady;
      setReady(nextReady);
    } catch (err: unknown) {
      if (ac.signal.aborted) return;
      setError({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unknown error fetching towns totals",
      });
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  }, [granularity, endISO]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [key, load]);

  const ids = useMemo<TownId[]>(
    () => ready?.items.map((i) => i.id) ?? [],
    [ready]
  );

  const itemsById = useMemo<Record<TownId, TownDelta>>(() => {
    if (!ready) return {} as Record<TownId, TownDelta>;
    return Object.fromEntries(ready.items.map((i) => [i.id, i])) as Record<
      TownId,
      TownDelta
    >;
  }, [ready]);

  return {
    state: ready ?? ({ status: "loading" } as const),
    ids,
    itemsById,
    isInitialLoading,
    isFetching,
    error,
    refetch: load,
  };
}
