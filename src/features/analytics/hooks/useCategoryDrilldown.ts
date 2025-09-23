"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Granularity, DonutDatum, SeriesPoint } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";
import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  getCategoryDrilldown,
  type CategoryDrilldownResponse,
  type UrlSeries,
} from "@/features/analytics/services/drilldown";

type ReadyState = { status: "ready"; data: CategoryDrilldownResponse };
type LoadingState = { status: "idle" | "loading" };
type ErrorState = { status: "error"; error: Error };
type State = LoadingState | ErrorState | ReadyState;

export type CategoryDDOpts = {
  categoryId: CategoryId | null;
  /** Nivel 2 opcional: restringir a un municipio para sacar sub-actividades + seriesByUrl */
  townId?: TownId | null;
  granularity: Granularity;
  endISO?: string;
  auto?: boolean;
};

export function useCategoryDrilldown(opts: CategoryDDOpts | null | undefined) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const auto = opts?.auto ?? true;

  const key = useMemo(() => {
    const c = opts?.categoryId ?? "";
    const t = opts?.townId ?? "";
    const g = opts?.granularity ?? "";
    const e = opts?.endISO ?? "";
    return `${c}|${t}|${g}|${e}`;
  }, [opts?.categoryId, opts?.townId, opts?.granularity, opts?.endISO]);

  const load = useCallback(async () => {
    if (!opts?.categoryId) {
      setState({ status: "idle" });
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    try {
      const data = await getCategoryDrilldown({
        categoryId: opts.categoryId,
        granularity: opts.granularity,
        endISO: opts.endISO,
        townId: opts.townId ?? undefined,
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
  }, [opts?.categoryId, opts?.townId, opts?.granularity, opts?.endISO]);

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

    // Proyecciones con defaults seguros
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
