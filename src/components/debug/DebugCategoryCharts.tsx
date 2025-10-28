"use client";

import ChartPair from "@/components/common/ChartPair";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

interface DebugCategoryChartsProps {
  categoryId: CategoryId | null;
  granularity: Granularity;
  // Series para GA4
  ga4Series: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  // Series para Chatbot
  chatbotSeries: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  // Series combinadas
  combinedSeries: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  // Donut data
  ga4DonutData: DonutDatum[];
  chatbotDonutData: DonutDatum[];
  combinedDonutData: DonutDatum[];
  // Delta percentages
  ga4DeltaPct: number | null;
  chatbotDeltaPct: number | null;
  combinedDeltaPct: number | null;
}

export default function DebugCategoryCharts({
  categoryId,
  granularity,
  ga4Series,
  chatbotSeries,
  combinedSeries,
  ga4DonutData,
  chatbotDonutData,
  combinedDonutData,
  ga4DeltaPct,
  chatbotDeltaPct,
  combinedDeltaPct,
}: DebugCategoryChartsProps) {
  if (!categoryId) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500 dark:text-gray-400">
        Selecciona una categoría para ver las gráficas
      </div>
    );
  }

  const categoryLabel = CATEGORY_META[categoryId].label;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">
        📈 Gráficas para: {categoryLabel}
      </h3>

      {/* GA4 Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-4">
          🔵 GA4 Analytics
        </h4>
        <ChartPair
          mode="line"
          series={ga4Series}
          donutData={ga4DonutData}
          deltaPct={ga4DeltaPct}
          granularity={granularity}
          donutCenterLabel="GA4"
        />
      </div>

      {/* Chatbot Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-4">
          🟢 Chatbot
        </h4>
        <ChartPair
          mode="line"
          series={chatbotSeries}
          donutData={chatbotDonutData}
          deltaPct={chatbotDeltaPct}
          granularity={granularity}
          donutCenterLabel="Chatbot"
        />
      </div>

      {/* Combined Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-4">
          🟣 Combinado (GA4 + Chatbot)
        </h4>
        <ChartPair
          mode="line"
          series={combinedSeries}
          donutData={combinedDonutData}
          deltaPct={combinedDeltaPct}
          granularity={granularity}
          donutCenterLabel="Total"
        />
      </div>
    </div>
  );
}
