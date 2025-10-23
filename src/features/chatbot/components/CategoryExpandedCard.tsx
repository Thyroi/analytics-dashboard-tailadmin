/**
 * Componente de drilldown expandido similar a SectorExpandedCard
 * Muestra ChartPair con datos de subcategorías por fechas
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import Image from "next/image";
import { useCategoryDrilldown } from "../hooks/useCategoryDrilldownReal";
import type { Granularity } from "../types";

type Props = {
  categoryId: CategoryId;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
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
            <Image
              src={imgSrc}
              alt={title}
              width={32}
              height={32}
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

export default function CategoryExpandedCard({
  categoryId,
  granularity,
  startDate,
  endDate,
  onClose,
  onSubcategoryClick,
}: Props) {
  const drilldownData = useCategoryDrilldown({
    categoryId,
    granularity,
    startDate,
    endDate,
  });

  const categoryMeta = CATEGORY_META[categoryId];
  const categoryLabel = categoryMeta?.label || categoryId;
  const categoryIcon = categoryMeta?.iconSrc;

  const { lineSeriesData, donutData, totalInteractions, error } = drilldownData;

  // Subtítulo con información detallada
  const subtitle = `Análisis detallado por subcategorías • ${totalInteractions.toLocaleString()} interacciones totales`;

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm w-full">
        <Header
          title={categoryLabel}
          subtitle="Error al cargar datos"
          imgSrc={categoryIcon}
          onClose={onClose}
        />
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-2">
            Error al cargar datos de {categoryLabel}
          </div>
          <p className="text-red-500 dark:text-red-300 text-sm">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <Header
        title={categoryLabel}
        subtitle={subtitle}
        imgSrc={categoryIcon}
        onClose={onClose}
      />

      <ChartPair
        mode="line"
        series={{
          current: lineSeriesData,
          previous: [],
        }}
        donutData={donutData}
        deltaPct={null}
        onDonutSlice={handleDonutSlice}
        donutCenterLabel={categoryLabel}
        showActivityButton={false}
        actionButtonTarget={`/chatbot/category/${categoryId}/activity`}
        granularity={granularity}
        className=""
      />
    </div>
  );
}
