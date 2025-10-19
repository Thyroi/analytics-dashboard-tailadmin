/**
 * Componente de drilldown para mostrar detalles de una categoría específica
 * Usa ChartPair con modo "grouped" + DonutChart
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { useCategoryDrilldown } from "../hooks/useCategoryDrilldownReal";
import type { Granularity } from "../types";

type Props = {
  categoryId: CategoryId;
  granularity: Granularity;
  onBack?: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
};

export default function CategoryDrilldownView({
  categoryId,
  granularity,
  onBack,
  onSubcategoryClick,
}: Props) {
  const drilldownData = useCategoryDrilldown({
    categoryId,
    granularity,
  });

  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;
  const {
    subcategories,
    groupedSeries,
    groupedCategories,
    donutData,
    totalInteractions,
    isLoading,
    error,
  } = drilldownData;

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (error) {
    return (
      <div className="max-w-[1560px] mx-auto w-full px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error al cargar datos de {categoryLabel}
              </h3>
              <p className="text-red-600 dark:text-red-300">{error.message}</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1560px] mx-auto w-full space-y-6">
      {/* Header with back button */}
      <div className="px-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Volver"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categoryLabel}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Análisis detallado por subcategorías •{" "}
                  {totalInteractions.toLocaleString()} interacciones totales
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with ChartPair */}
      <div className="px-4">
        <ChartPair
          mode="grouped"
          categories={groupedCategories}
          groupedSeries={groupedSeries}
          chartTitle="Interacciones por Fecha"
          chartSubtitle={`Evolución temporal de subcategorías en ${categoryLabel}`}
          chartHeight={400}
          tooltipFormatter={(val) => `${val} interacciones`}
          yAxisFormatter={(val) => `${val}`}
          donutData={donutData}
          deltaPct={null} // Se puede calcular si se tienen datos históricos
          onDonutSlice={handleDonutSlice}
          donutCenterLabel={categoryLabel}
          showActivityButton={true}
          actionButtonTarget={`/chatbot/category/${categoryId}/activity`}
          loading={isLoading}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        />
      </div>

      {/* Additional insights */}
      {!isLoading && (
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Subcategoría más popular
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {donutData.length > 0
                  ? donutData.reduce((max, item) =>
                      item.value > max.value ? item : max
                    ).label
                  : "N/A"}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total subcategorías
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {subcategories.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Promedio por subcategoría
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {donutData.length > 0
                  ? Math.round(
                      totalInteractions / donutData.length
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
