"use client";

import {
  getCategoryDetails,
  type CategoryDetailsResponse,
} from "@/features/analytics/services/categoryDetails";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type State =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      series: { current: SeriesPoint[]; previous: SeriesPoint[] };
      donutData: DonutDatum[];
    }
  | { status: "error"; message: string };

/**
 * Ahora acepta `endISO` y lo pasa al service, para que el backend
 * calcule la ventana “ending at endISO”.
 */
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  endISO?: string
) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    getCategoryDetails({
      categoryId: id,
      granularity,
      endISO,
      signal: ac.signal,
    })
      .then((raw: CategoryDetailsResponse) => {
        if (ac.signal.aborted) return;
        const series = raw?.series ?? { current: [], previous: [] };
        const donut = raw?.donutData ?? [];
        setState({ status: "ready", series, donutData: donut });
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Unknown error fetching category details";
        setState({ status: "error", message });
      });

    return () => ac.abort();
  }, [id, granularity, endISO]);

  const series = useMemo(
    () =>
      state.status === "ready" ? state.series : { current: [], previous: [] },
    [state]
  );
  const donutData = useMemo(
    () => (state.status === "ready" ? state.donutData : []),
    [state]
  );

  return { state, series, donutData };
}
