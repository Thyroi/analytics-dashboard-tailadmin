"use client";

import type {
  Granularity,
  KPISeries,
  Metric,
  Point,
  SliceName,
} from "@/lib/types/index";
import { useMemo } from "react";
import { useOverview } from "./useOverview";

type CompareResult = {
  kpiSeries: KPISeries | null;
  currentValue: number;
  deltaPct: number;
  isLoadingPrev: boolean;
  errorPrev: Error | null;
};

function pctChange(curr: number, prev: number): number {
  if (!isFinite(prev) || prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/**
 * Obtiene overview actual (hook) + overview del periodo anterior (fetch),
 * y devuelve KPISeries + currentValue + deltaPct para la métrica pedida.
 */
export default function useOverviewCompare(
  slice: SliceName,
  metric: Metric,
  granularity: Granularity,
  startTime: string,
  endTime: string
): CompareResult {
  const { data: currentData } = useOverview(
    slice,
    granularity,
    startTime,
    endTime
  );

  // Usar los datos previos directamente del payload
  const kpiSeries: KPISeries | null = useMemo(() => {
    if (!currentData) return null;
    const curr: Point[] =
      metric === "users" || metric === "visits"
        ? currentData.series.usersByBucket
        : currentData.series.interactionsByBucket;
    const prev: Point[] =
      metric === "users" || metric === "visits"
        ? currentData.series.usersByBucketPrev
        : currentData.series.interactionsByBucketPrev;
    return {
      bucket: currentData.meta.granularity,
      current: curr.map((p) => ({ label: p.label, value: p.value })),
      previous: prev.map((p) => ({ label: p.label, value: p.value })),
    };
  }, [currentData, metric]);

  const { currentValue, deltaPct } = useMemo(() => {
    if (!currentData) return { currentValue: 0, deltaPct: 0 };

    // Para granularidad diaria, usar el último punto de la serie en lugar del total
    if (granularity === "d") {
      const currSeries =
        metric === "users" || metric === "visits"
          ? currentData.series.usersByBucket
          : currentData.series.interactionsByBucket;

      const prevSeries =
        metric === "users" || metric === "visits"
          ? currentData.series.usersByBucketPrev
          : currentData.series.interactionsByBucketPrev;

      // Valor del último día (último punto de la serie actual)
      const lastDayValue =
        currSeries.length > 0 ? currSeries[currSeries.length - 1].value : 0;

      // Para el delta, comparar con el último día del período anterior
      const lastDayPrevValue =
        prevSeries.length > 0 ? prevSeries[prevSeries.length - 1].value : 0;

      return {
        currentValue: lastDayValue,
        deltaPct: Math.round(pctChange(lastDayValue, lastDayPrevValue)),
      };
    }

    // Para otras granularidades (w, m, y), usar totales como antes
    const currTot =
      metric === "users" || metric === "visits"
        ? currentData.totals.users
        : currentData.totals.interactions;
    const prevTot =
      metric === "users" || metric === "visits"
        ? currentData.totals.usersPrev
        : currentData.totals.interactionsPrev;
    return {
      currentValue: currTot,
      deltaPct: Math.round(pctChange(currTot, prevTot)),
    };
  }, [currentData, metric, granularity]);

  // Ya no hay loading/error previos porque todo viene en el mismo payload
  return {
    kpiSeries,
    currentValue,
    deltaPct,
    isLoadingPrev: false,
    errorPrev: null,
  };
}

// export default useOverviewCompare; (eliminado, ya está exportado arriba)
