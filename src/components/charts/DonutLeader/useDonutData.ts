import { useMemo } from "react";
import type { DonutDatum, DonutItem } from "./DonutLeader.types";

interface UseDonutDataParams {
  data: DonutDatum[];
  maxSlices: number;
  palette: readonly string[];
}

interface DonutDataResult {
  items: DonutItem[];
  total: number;
}

/**
 * Hook para normalizar datos y crear agregado "Otros" si excede maxSlices
 */
export function useDonutData({
  data,
  maxSlices,
  palette,
}: UseDonutDataParams): DonutDataResult {
  return useMemo(() => {
    const series: DonutItem[] = data.map((d, i) => ({
      ...d,
      color: d.color ?? palette[i % palette.length],
      __i: i,
    }));
    const sum = series.reduce((a, b) => a + (b.value || 0), 0);
    if (series.length <= maxSlices) return { items: series, total: sum };

    const sorted = series.slice().sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, maxSlices - 1);
    const rest = sorted.slice(maxSlices - 1);
    const othersVal = rest.reduce((s, x) => s + x.value, 0);

    const others: DonutItem = {
      label: "Otros",
      value: othersVal,
      color: "#9CA3AF",
      __isOthers: true,
      __others: rest.map((x) => x.__i as number),
    };

    return { items: [...top, others], total: sum };
  }, [data, maxSlices, palette]);
}
