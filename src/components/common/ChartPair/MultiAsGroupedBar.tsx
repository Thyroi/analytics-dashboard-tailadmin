"use client";

import GroupedBarChart, {
  type GroupedBarSeries,
} from "@/components/charts/GroupedBarChart";
import type { UrlSeries } from "@/features/analytics/services/drilldown";

type MultiAsGroupedBarProps = {
  seriesBySub: UrlSeries[];
  loading?: boolean;
};

export function MultiAsGroupedBar({
  seriesBySub,
  loading = false,
}: MultiAsGroupedBarProps) {
  if (loading) {
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

  // Convertir seriesBySub a formato GroupedBar
  // Cada URL es una categoría, y solo tomamos el último valor (día actual)
  const categories = seriesBySub.map((s) => s.name);
  const values = seriesBySub.map((s) => {
    // Tomar el último valor de la serie (día actual)
    const lastValue = s.data[s.data.length - 1];
    return lastValue || 0;
  });

  const groupedSeries: GroupedBarSeries[] = [
    {
      name: "Interacciones",
      data: values,
    },
  ];

  return (
    <GroupedBarChart
      title="Sub-actividades (comparativa por URL)"
      subtitle="Interacciones en el día seleccionado"
      categories={categories}
      series={groupedSeries}
      height={350}
      showLegend={false}
      legendPosition="bottom"
      tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
      yAxisFormatter={(val) => (val ?? 0).toString()}
    />
  );
}
