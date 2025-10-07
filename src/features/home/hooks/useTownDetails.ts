"use client";

import {
  getTownDetails,
  type TownDetailsResponse,
} from "@/features/analytics/services/townDetails";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
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
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time?: { endISO?: string } | string,
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl>;
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time: { startISO: string; endISO: string },
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl>;
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time?: TimeParams | string,
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl> {
  return useTownDetailsImpl(id, granularity, time, categoryId);
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

function useTownDetailsImpl(
  id: TownId | null,
  granularity: Granularity,
  time?: TimeParams | string,
  categoryId?: CategoryId
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

    getTownDetails({
      townId: id,
      granularity,
      ...(startISO && endISO
        ? { startISO, endISO }
        : endISO
        ? { endISO }
        : null),
      ...(categoryId ? { categoryId } : null),
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
  }, [id, granularity, startISO, endISO, categoryId]);

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
