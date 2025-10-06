"use client";

import {
  getTownDrilldown,
  type TownDrilldownResponse,
  type UrlSeries,
} from "@/features/analytics/services/drilldown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ReadyState = { status: "ready"; data: TownDrilldownResponse };
type LoadingState = { status: "idle" | "loading" };
type ErrorState = { status: "error"; error: Error };
type State = LoadingState | ErrorState | ReadyState;

export type TownCategoryDDOpts = {
  townId: TownId | null;
  categoryId: CategoryId | null;
  granularity: Granularity;
  endISO?: string;
  auto?: boolean;
};

export function useTownCategoryDrilldown(
  opts: TownCategoryDDOpts | null | undefined
) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const auto = opts?.auto ?? true;

  const key = useMemo(() => {
    const t = opts?.townId ?? "";
    const c = opts?.categoryId ?? "";
    const g = opts?.granularity ?? "";
    const e = opts?.endISO ?? "";
    return `${t}|${c}|${g}|${e}`;
  }, [opts?.townId, opts?.categoryId, opts?.granularity, opts?.endISO]);

  const load = useCallback(async () => {
    if (!opts?.townId) {
      setState({ status: "idle" });
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    try {
      const data = await getTownDrilldown({
        townId: opts.townId,
        granularity: opts.granularity,
        endISO: opts.endISO,
        categoryId: opts.categoryId ?? undefined,
        dayAsWeek: opts.granularity === "d",
      });

      if (!ac.signal.aborted) {
        setState({ status: "ready", data });
      }
    } catch (e) {
      if (!ac.signal.aborted) {
        const err = e instanceof Error ? e : new Error(String(e));
        setState({ status: "error", error: err });
      }
    }
  }, [opts?.townId, opts?.categoryId, opts?.granularity, opts?.endISO]);

  useEffect(() => {
    if (!auto) return;
    void load();
    return () => abortRef.current?.abort();
  }, [auto, key, load]);

  return {
    state,
    loading: state.status === "loading",
    error: state.status === "error" ? state.error : null,
    refetch: load,

    granularity: opts?.granularity,
    xLabels: useMemo<string[]>(
      () => (state.status === "ready" ? state.data.xLabels : []),
      [state]
    ),
    series: useMemo<{ current: SeriesPoint[]; previous: SeriesPoint[] }>(
      () =>
        state.status === "ready"
          ? state.data.series
          : { current: [], previous: [] },
      [state]
    ),
    donut: useMemo<DonutDatum[]>(
      () => (state.status === "ready" ? state.data.donut : []),
      [state]
    ),
    deltaPct: useMemo<number>(
      () => (state.status === "ready" ? state.data.deltaPct : 0),
      [state]
    ),
    seriesByUrl: useMemo<UrlSeries[]>(
      () => (state.status === "ready" ? state.data.seriesByUrl : []),
      [state]
    ),
  };
}
