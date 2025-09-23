"use client";

import { useEffect, useMemo, useState } from "react";
import type { Granularity } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";

export type TownDelta = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  deltaPct: number;
};

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; items: TownDelta[] }
  | { status: "error"; message: string };

export function useTownsTotals(granularity: Granularity) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    const ac = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/analytics/v1/dimensions/pueblos/totals?g=${granularity}`, {
      method: "GET",
      signal: ac.signal,
      headers: { "cache-control": "no-cache" },
    })
      .then((r) => r.json())
      .then((raw) => {
        const perTown = raw?.perTown as Record<TownId, { currentTotal: number; previousTotal: number; deltaPct: number }>;
        const items: TownDelta[] = Object.entries(perTown).map(([id, v]) => ({
          id: id as TownId,
          currentTotal: v.currentTotal ?? 0,
          previousTotal: v.previousTotal ?? 0,
          deltaPct: Number.isFinite(v.deltaPct) ? v.deltaPct : 0,
        }));
        setState({ status: "ready", items });
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unknown error fetching towns totals";
        setState({ status: "error", message });
      });

    return () => ac.abort();
  }, [granularity]);

  const ids = useMemo(() => {
    if (state.status !== "ready") return [] as TownId[];
    return state.items.map((i) => i.id);
  }, [state]);

  const itemsById = useMemo(() => {
    if (state.status !== "ready") return {} as Record<TownId, TownDelta>;
    return Object.fromEntries(state.items.map((i) => [i.id, i])) as Record<TownId, TownDelta>;
  }, [state]);

  return { state, ids, itemsById };
}
