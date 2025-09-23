"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useOverview } from "./useOverview";
import type {
  Granularity,
  KPISeries,
  Metric,
  SliceName,
  SeriesPoint,
  Point,
} from "@/lib/types";
import { getOverview } from "@/features/home/services/overview"; // ⬅️ nuevo import
import { prevComparable } from "@/lib/utils/datetime";

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
export function useOverviewCompare(slice: SliceName, metric: Metric): CompareResult {
  const { data: currentData } = useOverview(slice);

  const [prevTotal, setPrevTotal] = useState<number>(0);
  const [prevSeries, setPrevSeries] = useState<SeriesPoint[]>([]);
  const [isLoadingPrev, setIsLoadingPrev] = useState<boolean>(false);
  const [errorPrev, setErrorPrev] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPrev = useCallback(async () => {
    if (!currentData) return;

    const startTime = currentData.meta.range?.startTime ?? "";
    const endTime = currentData.meta.range?.endTime ?? "";
    if (!startTime || !endTime) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoadingPrev(true);
    setErrorPrev(null);

    try {
      const prevRange = prevComparable({ startTime, endTime });
      const g: Granularity = currentData.meta.granularity;

      const res = await getOverview({
        range: prevRange,
        granularity: g,
        signal: ac.signal,
      });

      if (metric === "users" || metric === "visits") {
        setPrevTotal(res.totals.users);
        setPrevSeries(
          res.series.usersByBucket.map((p: Point) => ({ label: p.label, value: p.value }))
        );
      } else {
        setPrevTotal(res.totals.interactions);
        setPrevSeries(
          res.series.interactionsByBucket.map((p: Point) => ({ label: p.label, value: p.value }))
        );
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setErrorPrev(err instanceof Error ? err : new Error(String(err)));
      setPrevTotal(0);
      setPrevSeries([]);
    } finally {
      if (!ac.signal.aborted) setIsLoadingPrev(false);
    }
  }, [currentData, metric]);

  useEffect(() => {
    void loadPrev();
    return () => abortRef.current?.abort();
  }, [loadPrev]);

  const kpiSeries: KPISeries | null = useMemo(() => {
    if (!currentData) return null;

    const curr: Point[] =
      metric === "users" || metric === "visits"
        ? currentData.series.usersByBucket
        : currentData.series.interactionsByBucket;

    return {
      bucket: currentData.meta.granularity,
      current: curr.map((p) => ({ label: p.label, value: p.value })),
      previous: prevSeries,
    };
  }, [currentData, metric, prevSeries]);

  const { currentValue, deltaPct } = useMemo(() => {
    if (!currentData) return { currentValue: 0, deltaPct: 0 };

    const currTot =
      metric === "users" || metric === "visits"
        ? currentData.totals.users
        : currentData.totals.interactions;

    return { currentValue: currTot, deltaPct: Math.round(pctChange(currTot, prevTotal)) };
  }, [currentData, metric, prevTotal]);

  return { kpiSeries, currentValue, deltaPct, isLoadingPrev, errorPrev };
}

export default useOverviewCompare;
