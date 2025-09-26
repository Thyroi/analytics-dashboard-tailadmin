"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";

export type TownDelta = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  deltaPct: number;
};

type LoadingState = { status: "idle" | "loading" };
type ReadyState = { status: "ready"; items: TownDelta[] };
type ErrorState = { status: "error"; message: string };
type State = LoadingState | ReadyState | ErrorState;

type RawTownTotals = Record<
  TownId,
  { currentTotal: number; previousTotal: number; deltaPct: number }
>;

export function useTownsTotals(granularity: Granularity, endISO?: string) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  // La clave incluye endISO para refetch cuando se cambia el rango
  const key = useMemo(() => `${granularity}|${endISO ?? ""}`, [granularity, endISO]);

  const load = useCallback(async () => {
    // cancelar request previo si existía
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    try {
      const params = new URLSearchParams({ g: granularity });
      if (endISO) params.set("end", endISO);

      const res = await fetch(
        `/api/analytics/v1/dimensions/pueblos/totals?${params.toString()}`,
        {
          method: "GET",
          signal: ac.signal,
          headers: { "cache-control": "no-cache" },
        }
      );

      const raw = (await res.json()) as { perTown?: RawTownTotals } | null;
      if (ac.signal.aborted) return;

      const perTown: RawTownTotals = raw?.perTown ?? ({} as RawTownTotals);

      const items: TownDelta[] = Object.entries(perTown).map(([id, v]) => ({
        id: id as TownId,
        currentTotal: Number.isFinite(v.currentTotal) ? v.currentTotal : 0,
        previousTotal: Number.isFinite(v.previousTotal) ? v.previousTotal : 0,
        deltaPct: Number.isFinite(v.deltaPct) ? v.deltaPct : 0,
      }));

      setState({ status: "ready", items });
    } catch (err: unknown) {
      if (ac.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : "Unknown error fetching towns totals";
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

  return { state, ids, itemsById };
}
