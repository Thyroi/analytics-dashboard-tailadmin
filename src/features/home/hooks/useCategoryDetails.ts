"use client";

import { useEffect, useMemo, useState } from "react";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { CategoryId } from "@/lib/taxonomy/categories";

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; series: { current: SeriesPoint[]; previous: SeriesPoint[] }; donutData: DonutDatum[] }
  | { status: "error"; message: string };

export function useCategoryDetails(id: CategoryId | null, granularity: Granularity) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/analytics/v1/dimensions/categorias/${id}/details?g=${granularity}`, {
      method: "GET",
      signal: ac.signal,
      headers: { "cache-control": "no-cache" },
    })
      .then((r) => r.json())
      .then((raw) => {
        const series = (raw?.series ?? { current: [], previous: [] }) as { current: SeriesPoint[]; previous: SeriesPoint[] };
        const donut = (raw?.donutData ?? []) as DonutDatum[];
        setState({ status: "ready", series, donutData: donut });
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unknown error fetching category details";
        setState({ status: "error", message });
      });

    return () => ac.abort();
  }, [id, granularity]);

  const series = useMemo(() => state.status === "ready" ? state.series : { current: [], previous: [] }, [state]);
  const donutData = useMemo(() => state.status === "ready" ? state.donutData : [], [state]);

  return { state, series, donutData };
}
