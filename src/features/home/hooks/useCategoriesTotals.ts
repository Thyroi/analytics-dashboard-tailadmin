// src/features/home/hooks/useCategoriesTotals.ts
"use client";

import {
  getCategoriesTotals,
  type CategoriesTotalsResponse,
  type CategoryTotalsItem,
} from "@/features/home/services/categoriesTotals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ReadyState = {
  status: "ready";
  data: CategoriesTotalsResponse;
  ids: CategoryId[];
  itemsById: Record<
    CategoryId,
    { title: string; total: number; deltaPct: number | null }
  >;
};

export function useCategoriesTotals(granularity: Granularity, endISO?: string) {
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

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
      setIsFetching(true); // revalidando (mantener datos previos)
    }

    try {
      const data = await getCategoriesTotals(granularity, endISO);
      if (ac.signal.aborted) return;

      const ids: CategoryId[] = data.items.map(
        (it: CategoryTotalsItem) => it.id
      );

      const itemsById = data.items.reduce<ReadyState["itemsById"]>(
        (acc, it) => {
          acc[it.id] = {
            title: it.title,
            total: Number.isFinite(it.total) ? it.total : 0,
            deltaPct:
              typeof it.deltaPct === "number" && Number.isFinite(it.deltaPct)
                ? it.deltaPct
                : null,
          };
          return acc;
        },
        {} as ReadyState["itemsById"]
      );

      const nextReady: ReadyState = { status: "ready", data, ids, itemsById };
      cacheRef.current = nextReady;
      setReady(nextReady);
    } catch (e) {
      if (ac.signal.aborted) return;
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  }, [granularity, endISO]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [key, load]);

  const ids = ready?.ids ?? [];
  const itemsById = (ready?.itemsById ??
    ({} as ReadyState["itemsById"])) as ReadyState["itemsById"];

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
