"use client";

import {
  getTownDetails,
  type TownDetailsResponse,
} from "@/features/analytics/services/townDetails";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
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
 * Ahora acepta `endISO` y (opcionalmente) `categoryId` por si filtras
 * pueblo+categoría desde el 2º nivel del drilldown.
 */
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  endISO?: string,
  categoryId?: CategoryId
) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    getTownDetails({
      townId: id,
      granularity,
      endISO,
      ...(categoryId ? { categoryId } : {}),
      signal: ac.signal,
    })
      .then((raw: TownDetailsResponse) => {
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
            : "Unknown error fetching town details";
        setState({ status: "error", message });
      });

    return () => ac.abort();
  }, [id, granularity, endISO, categoryId]);

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
