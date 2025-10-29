"use client";

import GroupedBarChart, {
  type GroupedBarSeries,
} from "@/components/charts/GroupedBarChart";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { Granularity, SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import { minLen } from "./helpers";

type LineSideProps = {
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  granularity?: Granularity;
};

export function LineSide({ series, granularity = "d" }: LineSideProps) {
  // ✅ Para granularidad "d": GroupedBarChart con 1 fecha, 2 barras (current vs previous)
  if (granularity === "d") {
    // Tomar SOLO el último punto (ayer)
    const lastCurrent = series.current[series.current.length - 1];
    const lastPrevious = series.previous[series.previous.length - 1];

    // Si no hay datos current, mostrar skeleton de carga
    if (!lastCurrent) {
      return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    // Obtener labels dinámicas según granularidad
    const labels = getSeriesLabels(granularity);

    const categories = [lastCurrent.label]; // ["26 oct"]

    // SIEMPRE mostrar ambas barras: previous (puede ser 0) y current
    const groupedSeries: GroupedBarSeries[] = [
      { name: labels.previous, data: [lastPrevious?.value ?? 0] }, // ✅ Previous (0 si no hay datos)
      { name: labels.current, data: [lastCurrent.value] }, // ✅ Current
    ];

    return (
      <div className="w-full h-full">
        <GroupedBarChart
          title="Comparación diaria"
          subtitle="Ayer vs Anteayer"
          categories={categories}
          series={groupedSeries}
          height={350}
          showLegend={true}
          legendPosition="bottom"
          tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
          yAxisFormatter={(val) => (val ?? 0).toString()}
        />
      </div>
    );
  }

  // Para otras granularidades, usar el gráfico de líneas original
  // categorías originales desde la serie current (ya viene bucketizada por backend)
  const rawCats = series.current.map((p) => p.label);

  // n efectivo
  const nSeries = minLen(series);
  const n = Math.min(nSeries, rawCats.length);

  // recortes alineados
  // Si los labels ya están formateados (no son ISO), usarlos directamente
  const firstLabel = rawCats[0] || "";
  const isAlreadyFormatted =
    firstLabel.length > 0 && !firstLabel.match(/^\d{4}-\d{2}(-\d{2})?$/); // No es formato ISO YYYY-MM-DD ni YYYY-MM

  const cats = isAlreadyFormatted
    ? rawCats.slice(-n) // Ya formateados por buildAxisFromChatbot
    : formatChartLabelsSimple(rawCats.slice(-n), granularity); // Formatear para analytics

  const curr = series.current.slice(-n).map((p) => p.value);
  const prev = series.previous.slice(-n).map((p) => p.value);

  return (
    <div className="w-full h-full">
      <ChartSection
        categories={cats}
        currData={curr}
        prevData={prev}
        granularity={granularity}
      />
    </div>
  );
}
