"use client";

import {
  getCategoryDetails,
  type CategoryDetailsResponse,
} from "@/features/analytics/services/categoryDetails";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

/** Permite rango completo, objeto con endISO, o string endISO. */
export type TimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | undefined;

type State =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      series: { current: SeriesPoint[]; previous: SeriesPoint[] };
      donutData: DonutDatum[];
    }
  | { status: "error"; message: string };

// Overloads
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time?: { endISO?: string } | string
): ReturnType<typeof useCategoryDetailsImpl>;
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time: { startISO: string; endISO: string }
): ReturnType<typeof useCategoryDetailsImpl>;
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time?: TimeParams | string
): ReturnType<typeof useCategoryDetailsImpl> {
  return useCategoryDetailsImpl(id, granularity, time);
}

function isFullRange(t: TimeParams): t is { startISO: string; endISO: string } {
  return (
    !!t &&
    typeof t === "object" &&
    "startISO" in t &&
    "endISO" in t &&
    typeof t.startISO === "string" &&
    typeof t.endISO === "string"
  );
}

function normalizeTime(time?: TimeParams | string): {
  startISO?: string;
  endISO?: string;
} {
  if (typeof time === "string") return { endISO: time };
  if (!time) return {};
  if (isFullRange(time))
    return { startISO: time.startISO, endISO: time.endISO };
  return { endISO: time.endISO };
}

function useCategoryDetailsImpl(
  id: CategoryId | null,
  granularity: Granularity,
  time?: TimeParams | string
) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const { startISO, endISO } = normalizeTime(time);

  useEffect(() => {
    if (!id) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });

    getCategoryDetails({
      categoryId: id,
      granularity,
      ...(startISO && endISO
        ? { startISO, endISO }
        : endISO
        ? { endISO }
        : null),
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
  }, [id, granularity, startISO, endISO]);

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
