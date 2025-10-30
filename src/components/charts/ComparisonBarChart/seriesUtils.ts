import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import { generateBrandGradient } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import type { ComparisonSeries } from "./types";

// Usar la paleta de colores del brand (misma que las donuts)
const COMPARISON_COLORS = generateBrandGradient(2); // Previous y Current usando brand palette

export function useSeriesData(
  series: ComparisonSeries,
  granularity: "d" | "w" | "m" | "y"
) {
  // Preparar categorías (labels del eje X) con formateo según granularidad
  const categories = useMemo(() => {
    const rawLabels = series.current.map((point) => point.label);
    return formatChartLabelsSimple(rawLabels, granularity);
  }, [series, granularity]);

  // Obtener labels dinámicas según granularidad
  const seriesLabels = useMemo(
    () => getSeriesLabels(granularity),
    [granularity]
  );

  // Preparar datos para ApexCharts
  const chartSeries = useMemo(() => {
    return [
      {
        name: seriesLabels.previous,
        data: series.previous.map((point) => point.value),
        color: COMPARISON_COLORS[0],
      },
      {
        name: seriesLabels.current,
        data: series.current.map((point) => point.value),
        color: COMPARISON_COLORS[1],
      },
    ];
  }, [series, seriesLabels]);

  return { categories, chartSeries, colors: COMPARISON_COLORS };
}
