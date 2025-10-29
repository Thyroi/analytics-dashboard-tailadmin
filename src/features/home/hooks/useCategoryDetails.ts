"use client";

import { useCombinedCategoryTownBreakdown } from "@/features/home/hooks/useCombinedCategoryTownBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { useMemo } from "react";

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

// Overloads para mantener compatibilidad
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
  const { startISO, endISO } = normalizeTime(time);

  // Calcular rangos usando computeRangesForKPI para respetar la granularidad seleccionada
  const ranges = useMemo(() => {
    if (startISO && endISO) {
      // IMPORTANTE: Para Home, usar computeRangesForKPI que respeta la granularidad exacta:
      // - Granularidad "d": 1 día (ayer vs anteayer)
      // - Granularidad "w": 7 días
      // - Granularidad "m": 30 días
      // - Granularidad "y": 365 días
      return computeRangesForKPI(granularity, startISO, endISO);
    } else {
      // Sin rango completo, usar preset terminando en endISO (o yesterday)
      return computeRangesForKPI(granularity, null, endISO);
    }
  }, [granularity, startISO, endISO]);

  // Usar el nuevo hook combinado que integra GA4 + Chatbot con normalización
  const combinedResult = useCombinedCategoryTownBreakdown(
    id,
    granularity,
    ranges.current.start,
    ranges.current.end
  );

  // Estado combinado (GA4 + Chatbot)
  const state: State = useMemo(() => {
    if (combinedResult.isLoading) {
      return { status: "loading" };
    }

    if (combinedResult.isError) {
      return { status: "error", message: "Error loading category details" };
    }

    if (combinedResult.series && combinedResult.donutData) {
      return {
        status: "ready",
        series: combinedResult.series,
        donutData: combinedResult.donutData,
      };
    }

    return { status: "idle" };
  }, [combinedResult]);

  const series = useMemo(
    () =>
      state.status === "ready" ? state.series : { current: [], previous: [] },
    [state]
  );

  const donutData = useMemo(
    () => (state.status === "ready" ? state.donutData : []),
    [state]
  );

  return {
    state,
    series,
    donutData,
    isPending: combinedResult.isLoading,
  };
}
