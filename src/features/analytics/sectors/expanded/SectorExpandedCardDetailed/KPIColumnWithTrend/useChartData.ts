import type { SeriesPoint } from "@/lib/types";
import { useMemo } from "react";

export function useChartData(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}) {
  return useMemo(() => {
    const n = Math.min(series.current.length, series.previous.length);
    const cur = series.current.slice(-n);
    const prev = series.previous.slice(-n);
    return {
      categories: cur.map((p) => p.label),
      currData: cur.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [series]);
}
