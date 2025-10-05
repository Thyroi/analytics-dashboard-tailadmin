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

type LoadingState = { status: "idle" | "loading" };
type ReadyState = {
  status: "ready";
  data: TownsTotalsUIResponse;
  items: TownDelta[];
};
type ErrorState = { status: "error"; message: string };
type State = LoadingState | ReadyState | ErrorState;

export function useTownsTotals(granularity: Granularity, endISO?: string) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

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

      setState({ status: "ready", data: res, items });
    } catch (err: unknown) {
      if (ac.signal.aborted) return;
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error fetching towns totals";
      setState({ status: "error", message });
    }
  }, [granularity, endISO]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [key, load]);

  const ids = useMemo(() => {
    if (state.status !== "ready") return [] as TownId[];
    return state.items.map((i) => i.id);
  }, [state]);

  const itemsById = useMemo(() => {
    if (state.status !== "ready") return {} as Record<TownId, TownDelta>;
    return Object.fromEntries(state.items.map((i) => [i.id, i])) as Record<
      TownId,
      TownDelta
    >;
  }, [state]);

  return { state, ids, itemsById, refetch: load };
}
