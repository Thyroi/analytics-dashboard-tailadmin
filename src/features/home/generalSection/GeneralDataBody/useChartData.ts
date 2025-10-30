import type { Granularity, KPISeries } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { useMemo } from "react";

export function useChartData(kpiSeries: KPISeries, granularity: Granularity) {
  return useMemo(() => {
    const current = kpiSeries.current;
    const previous = kpiSeries.previous;

    const n = Math.min(current.length, previous.length);
    const currSlice = current.slice(current.length - n);
    const prevSlice = previous.slice(previous.length - n);

    const rawCategories = currSlice.map((p) => p.label);
    return {
      categories: formatChartLabelsSimple(rawCategories, granularity),
      currData: currSlice.map((p) => p.value),
      prevData: prevSlice.map((p) => p.value),
    };
  }, [kpiSeries, granularity]);
}
