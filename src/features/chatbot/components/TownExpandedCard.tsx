import ChartPair from "@/components/common/ChartPair";
import { useMemo, useState } from "react";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useTownCategoryBreakdown } from "../hooks/useTownCategoryBreakdown";
import TownCategorySubcatDrilldownView from "./TownCategorySubcatDrilldownView";

type Props = {
  townId: string;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onSelectCategory?: (categoryId: CategoryId) => void;
};

function Header({
  title,
  subtitle,
  imgSrc,
  onClose,
}: {
  title: string;
  subtitle: string;
  imgSrc?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        {imgSrc && (
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={title}
              className="w-8 h-8 rounded-lg object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Cerrar"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function TownExpandedCard({
  townId,
  granularity,
  startDate,
  endDate,
  onClose,
  onSelectCategory,
}: Props) {
  const townMeta = TOWN_META[townId as TownId];
  const townLabel = townMeta?.label || townId;
  const townIcon = townMeta?.iconSrc;

  // Estado para navegación Nivel 1 <-> Nivel 2
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  // Usar el nuevo hook de breakdown por categorías
  const { data, isLoading, isError, error } = useTownCategoryBreakdown({
    townId: townId as TownId,
    startISO: startDate,
    endISO: endDate,
    windowGranularity: granularity,
    enabled: true,
  });

  // Transformar datos a formato ChartPair
  const { donutData, groupedSeries, totalInteractions, categoriesForXAxis } =
    useMemo(() => {
      const categories = data?.categories || [];

      if (!categories || categories.length === 0) {
        return {
          donutData: [],
          groupedSeries: [],
          totalInteractions: 0,
          categoriesForXAxis: [],
        };
      }

      // Donut: participación por categoría (current totals)
      const donut: DonutDatum[] = categories
        .filter((cat) => cat.currentTotal > 0)
        .map((cat) => ({
          label: CATEGORY_META[cat.categoryId].label,
          value: cat.currentTotal,
          color: undefined, // ChartPair asigna colores automáticamente
        }));

      // Grouped Bar: Top categorías (ordenadas por current total)
      const topN = 8; // Configurable
      const topCategories = [...categories]
        .sort((a, b) => b.currentTotal - a.currentTotal)
        .slice(0, topN);

      const grouped: GroupedBarSeries[] = [
        {
          name: "Interacciones",
          data: topCategories.map((cat) => cat.currentTotal),
          color: "#3b82f6", // blue-500
        },
      ];

      const total = categories.reduce((sum, cat) => sum + cat.currentTotal, 0);

      const xAxisLabels = topCategories.map(
        (cat) => CATEGORY_META[cat.categoryId].label
      );

      return {
        donutData: donut,
        groupedSeries: grouped,
        totalInteractions: total,
        categoriesForXAxis: xAxisLabels,
      };
    }, [data?.categories]);

  // Subtítulo con información detallada
  const subtitle = `Análisis por categorías • ${totalInteractions.toLocaleString()} interacciones totales`;

  // Handler para click en categoría (donut o barra)
  const handleCategoryClick = (label: string) => {
    if (!data?.categories) return;

    // Buscar categoryId por label
    const category = data.categories.find(
      (cat) => CATEGORY_META[cat.categoryId].label === label
    );
    if (category) {
      setSelectedCategoryId(category.categoryId);
      // También llamar al callback externo si existe
      if (onSelectCategory) {
        onSelectCategory(category.categoryId);
      }
    }
  };

  // Handler para volver de Nivel 2 a Nivel 1
  const handleBackToLevel1 = () => {
    setSelectedCategoryId(null);
  };

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <Header
          title="Error cargando datos"
          subtitle={error?.message || "Error desconocido"}
          onClose={onClose}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Header
          title={townLabel}
          subtitle="Cargando datos..."
          imgSrc={townIcon}
          onClose={onClose}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (
    !data?.categories ||
    data.categories.length === 0 ||
    totalInteractions === 0
  ) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Header
          title={townLabel}
          subtitle={subtitle}
          imgSrc={townIcon}
          onClose={onClose}
        />
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center">
            No hay datos de categorías para este pueblo en el período
            seleccionado
          </p>
        </div>
      </div>
    );
  }

  // Si hay una categoría seleccionada, mostrar Nivel 2 (subcategorías)
  if (selectedCategoryId) {
    return (
      <TownCategorySubcatDrilldownView
        townId={townId as TownId}
        categoryId={selectedCategoryId}
        startISO={startDate}
        endISO={endDate}
        windowGranularity={granularity}
        onBack={handleBackToLevel1}
      />
    );
  }

  // Nivel 1: Categorías
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header con X para cerrar */}
      <Header
        title={townLabel}
        subtitle={subtitle}
        imgSrc={townIcon}
        onClose={onClose}
      />

      {/* Gráficas */}
      <div className="px-4">
        <ChartPair
          mode="grouped"
          categories={categoriesForXAxis}
          groupedSeries={groupedSeries}
          donutData={donutData}
          deltaPct={null}
          onDonutSlice={handleCategoryClick}
          donutCenterLabel={townLabel}
          showActivityButton={false}
          chartTitle="Top Categorías"
          chartSubtitle={`${totalInteractions.toLocaleString()} interacciones totales`}
          chartHeight={400}
          className=""
        />
      </div>
    </div>
  );
}
