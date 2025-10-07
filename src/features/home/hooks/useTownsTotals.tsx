"use client";

import {
  getTownsTotals,
  type TownsTotalsUIResponse,
  type TownTotalsItem,
} from "@/features/home/services/townsTotals";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Permite rango completo, objeto con endISO, o string endISO. */
export type TimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | undefined;

export type TownDelta = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  deltaPct: number | null;
};

type ReadyState = {
  status: "ready";
  data: TownsTotalsUIResponse;
  items: TownDelta[];
};
type ErrorState = { status: "error"; message: string };

// Overloads
export function useTownsTotals(
  granularity: Granularity,
  time?: { endISO?: string } | string
): ReturnType<typeof useTownsTotalsImpl>;
export function useTownsTotals(
  granularity: Granularity,
  time: { startISO: string; endISO: string }
): ReturnType<typeof useTownsTotalsImpl>;
export function useTownsTotals(
  granularity: Granularity,
  time?: TimeParams | string
): ReturnType<typeof useTownsTotalsImpl> {
  return useTownsTotalsImpl(granularity, time);
}

function isFullRange(t: TimeParams): t is { startISO: string; endISO: string } {
  return (
    !!t &&
    typeof t === "object" &&
    "startISO" in t &&
    "endISO" in t &&
    typeof t.startISO === "string" &&
    typeof t.endISO === "string"
  );
}

function normalizeEndISO(time?: TimeParams | string): string | undefined {
  if (typeof time === "string") return time;
  if (!time) return undefined;
  return isFullRange(time) ? time.endISO : time.endISO;
}

function useTownsTotalsImpl(
  granularity: Granularity,
  time?: TimeParams | string
) {
  const endISO = normalizeEndISO(time); // services actuales sólo aceptan endISO

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
    if (!hasCache) setIsInitialLoading(true);
    else setIsFetching(true);

    try {
      // TODO: cuando el service soporte start+end, pásalos desde `time`
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
