import { generateBrandGradient } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import type { GroupedBarSeries } from "./types";

export function useChartColors(
  series: GroupedBarSeries[],
  defaultColors?: string[]
) {
  const chartSeries = useMemo(() => {
    // Generar colores de la paleta del proyecto si no se especifican
    const brandColors = defaultColors || generateBrandGradient(series.length);

    return series.map((s, index) => ({
      name: s.name,
      data: s.data,
      color: s.color || brandColors[index % brandColors.length],
    }));
  }, [series, defaultColors]);

  const colors = useMemo(() => {
    return chartSeries.map((s) => s.color);
  }, [chartSeries]);

  return { chartSeries, colors };
}
