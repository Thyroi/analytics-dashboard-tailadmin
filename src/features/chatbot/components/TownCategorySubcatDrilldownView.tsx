"use client";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useMemo } from "react";
import { useTownCategorySubcatBreakdown } from "../hooks/useTownCategorySubcatBreakdown";

type Props = {
  townId: TownId;
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity: Granularity;
  onBack: () => void;
};

function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Volver"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TownCategorySubcatDrilldownView({
  townId,
  categoryId,
  startISO,
  endISO,
  windowGranularity,
  onBack,
}: Props) {
  const townMeta = TOWN_META[townId];
  const categoryMeta = CATEGORY_META[categoryId];
  const townLabel = townMeta?.label || townId;
  const categoryLabel = categoryMeta?.label || categoryId;

  // Usar el hook para obtener subcategorías
  const { data, isLoading, isError, error } = useTownCategorySubcatBreakdown({
    townId,
    categoryId,
    startISO,
    endISO,
    windowGranularity,
    enabled: true,
  });

  // Transformar datos a formato ChartPair
  const { donutData, groupedSeries, totalInteractions, categoriesForXAxis } =
    useMemo(() => {
      const subcategories = data?.subcategories || [];

      if (!subcategories || subcategories.length === 0) {
        return {
          donutData: [],
          groupedSeries: [],
          totalInteractions: 0,
          categoriesForXAxis: [],
        };
      }

      // Donut: participación por subcategoría (current totals)
      const donut: DonutDatum[] = subcategories
        .filter((subcat) => subcat.currentTotal > 0)
        .map((subcat) => ({
          label: subcat.subcategoryName.toUpperCase(), // Normalizado y uppercase para UI
          value: subcat.currentTotal,
          color: undefined,
        }));

      // Grouped Bar: Top subcategorías (ya vienen ordenadas por total descendente)
      const topN = 10; // Configurable
      const topSubcats = subcategories.slice(0, topN);

      const grouped: GroupedBarSeries[] = [
        {
          name: "Interacciones",
          data: topSubcats.map((subcat) => subcat.currentTotal),
          color: "#10b981", // green-500 para diferenciarlo de Nivel 1
        },
      ];

      const total = subcategories.reduce(
        (sum, subcat) => sum + subcat.currentTotal,
        0
      );

      const xAxisLabels = topSubcats.map((subcat) =>
        subcat.subcategoryName.toUpperCase()
      );

      return {
        donutData: donut,
        groupedSeries: grouped,
        totalInteractions: total,
        categoriesForXAxis: xAxisLabels,
      };
    }, [data?.subcategories]);

  // Título y subtítulo
  const title = `${townLabel} › ${categoryLabel}`;
  const subtitle = `Subcategorías • ${totalInteractions.toLocaleString()} interacciones`;

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <Header
          title="Error cargando datos"
          subtitle={error?.message || "Error desconocido"}
          onBack={onBack}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Header
          title={title}
          subtitle="Cargando subcategorías..."
          onBack={onBack}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (
    !data?.subcategories ||
    data.subcategories.length === 0 ||
    totalInteractions === 0
  ) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Header title={title} subtitle={subtitle} onBack={onBack} />
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <p className="text-center">
            No hay subcategorías con datos en este período
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <Header title={title} subtitle={subtitle} onBack={onBack} />

      {/* Gráficas */}
      <div className="px-4">
        <ChartPair
          mode="grouped"
          categories={categoriesForXAxis}
          groupedSeries={groupedSeries}
          donutData={donutData}
          deltaPct={null}
          donutCenterLabel={categoryLabel}
          showActivityButton={false}
          chartTitle="Top Subcategorías"
          chartSubtitle={`${totalInteractions.toLocaleString()} interacciones totales`}
          chartHeight={400}
          className=""
        />
      </div>
    </div>
  );
}
