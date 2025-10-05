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
    {
      title: string;
      total: number;
      /** Puede ser null cuando no hay base de comparación */
      deltaPct: number | null;
    }
  >;
};
type LoadingState = { status: "idle" | "loading" };
type ErrorState = { status: "error"; error: Error };
type State = ReadyState | LoadingState | ErrorState;

export function useCategoriesTotals(granularity: Granularity, endISO?: string) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  // clave incluye endISO para refetch al cambiar rango
  const key = useMemo(
    () => `${granularity}|${endISO ?? ""}`,
    [granularity, endISO]
  );

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

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

      setState({ status: "ready", data, ids, itemsById });
    } catch (e) {
      if (ac.signal.aborted) return;
      const err = e instanceof Error ? e : new Error(String(e));
      setState({ status: "error", error: err });
    }
  }, [granularity, endISO]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [key, load]);

  const isLoading = state.status === "loading";
  const error = state.status === "error" ? state.error : null;

  const ids = state.status === "ready" ? state.ids : [];
  const itemsById =
    state.status === "ready"
      ? state.itemsById
      : ({} as ReadyState["itemsById"]);

  return {
    state,
    ids,
    itemsById,
    isLoading,
    error,
    refetch: load,
  };
}
