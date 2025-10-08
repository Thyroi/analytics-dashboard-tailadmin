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

/* ================= helpers de tipo (sin any) ================= */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function hasStringKey<K extends string>(
  x: unknown,
  key: K
): x is Record<K, string> {
  return isRecord(x) && key in x && typeof (x as Record<string, unknown>)[key] === "string";
}

function isFullRange(t: TimeParams): t is { startISO: string; endISO: string } {
  return (
    isRecord(t) &&
    hasStringKey(t, "startISO") &&
    hasStringKey(t, "endISO")
  );
}

/** Acepta backends con donutData (nuevo) o donut (legacy) */
type MaybeDonuts = { donutData?: DonutDatum[]; donut?: DonutDatum[] };
function pickDonutData(x: MaybeDonuts): DonutDatum[] {
  if (Array.isArray(x.donutData)) return x.donutData;
  if (Array.isArray(x.donut)) return x.donut;
  return [];
}

function normalizeTime(time?: TimeParams | string): {
  startISO?: string;
  endISO?: string;
} {
  if (typeof time === "string") return { endISO: time };
  if (!time) return {};
  if (isFullRange(time)) return { startISO: time.startISO, endISO: time.endISO };
  return { endISO: time.endISO };
}

/* ========================= API pública ========================= */
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

/* ========================= implementación ========================= */
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
      .then((raw: TownDetailsResponse & MaybeDonuts) => {
        if (ac.signal.aborted) return;

        const series =
          raw.series ?? ({ current: [], previous: [] } as {
            current: SeriesPoint[];
            previous: SeriesPoint[];
          });

        const donutData = pickDonutData(raw);

        setState({ status: "ready", series, donutData });
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
