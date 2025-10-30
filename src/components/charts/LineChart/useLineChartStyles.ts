import { useMemo } from "react";
import type { LineSeries } from "./types";

export function useLineChartStyles(
  series: LineSeries[],
  colorsByName: Record<string, string> | undefined,
  palette: readonly string[]
) {
  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [series, colorsByName, palette]);

  const dashArray = useMemo(
    () => series.map((s) => (s.name === "Total" ? 6 : 0)),
    [series]
  );

  const strokeWidths = useMemo(
    () => series.map((s) => (s.name === "Total" ? 3 : 2)),
    [series]
  );

  return { colors, dashArray, strokeWidths };
}
