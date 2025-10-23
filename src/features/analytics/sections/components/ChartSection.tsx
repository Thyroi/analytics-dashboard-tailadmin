/**
 * Chart section for comparative top pages
 */

import { BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "../ComparativeTopPages/components/ChartSkeleton";

// Lazy load the chart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartSectionProps {
  selectedPaths: string[];
  chartData: {
    series: Array<{
      name: string;
      data: Array<{ x: string; y: number }>;
      color: string;
    }>;
    categories: string[];
  } | null;
  formatNumber: (value: number) => string;
  isLoading?: boolean;
}

export function ChartSection({
  selectedPaths,
  chartData,
  formatNumber,
  isLoading = false,
}: ChartSectionProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comparativa de Páginas Top
        </h2>
      </div>

      {selectedPaths.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona hasta 8 páginas en la tabla para comparar
            </p>
          </div>
        </div>
      ) : (
        <div className="h-80">
          {chartData && (
            <ReactApexChart
              options={{
                chart: {
                  type: "line",
                  height: 320,
                  toolbar: { show: false },
                  background: "transparent",
                },
                theme: {
                  mode: "light",
                },
                colors: chartData.series.map((s) => s?.color).filter(Boolean),
                stroke: {
                  width: 2,
                  curve: "smooth",
                },
                xaxis: {
                  categories: chartData.categories,
                  labels: {
                    style: {
                      colors: "var(--apexcharts-text-color)",
                    },
                  },
                },
                yaxis: {
                  labels: {
                    style: {
                      colors: "var(--apexcharts-text-color)",
                    },
                    formatter: (value: number) => formatNumber(value),
                  },
                },
                grid: {
                  borderColor: "var(--apexcharts-grid-color)",
                  strokeDashArray: 3,
                },
                legend: {
                  position: "bottom",
                  labels: {
                    colors: "var(--apexcharts-text-color)",
                  },
                },
                tooltip: {
                  theme: "dark",
                  y: {
                    formatter: (value: number) =>
                      `${formatNumber(value)} visitas`,
                  },
                },
              }}
              series={chartData.series.filter(
                (s): s is NonNullable<typeof s> => s !== null
              )}
              type="line"
              height={320}
            />
          )}
        </div>
      )}
    </div>
  );
}
