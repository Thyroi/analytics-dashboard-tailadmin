import { useMemo } from "react";
import type { SubSeries } from "./types";

function padToLen(arr: number[], len: number): number[] {
  if (arr.length === len) return arr;
  if (arr.length > len) return arr.slice(0, len);
  const out = arr.slice();
  while (out.length < len) out.push(0);
  return out;
}

export function useChartSeries(
  seriesBySub: SubSeries[],
  xLabelsLength: number,
  maxSeries: number
) {
  const safeSeries = useMemo(() => seriesBySub ?? [], [seriesBySub]);

  const chartSeries = useMemo(() => {
    const N = Math.max(0, Math.min(maxSeries, safeSeries.length));
    return safeSeries.slice(0, N).map((s) => ({
      name: s.name,
      data: padToLen(s.data ?? [], xLabelsLength),
    }));
  }, [safeSeries, xLabelsLength, maxSeries]);

  const hasData = useMemo(
    () => chartSeries.some((s) => (s.data ?? []).some((v) => v > 0)),
    [chartSeries]
  );

  return { chartSeries, hasData };
}
