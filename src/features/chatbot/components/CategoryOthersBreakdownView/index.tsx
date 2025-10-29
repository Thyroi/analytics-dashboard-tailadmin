/**
 * Vista de nivel 2 para "Otros" (claves que no mapearon a pueblo)
 *
 * Muestra desglose por leaf (último token) de todas las claves no mapeadas
 * Ejemplo: root.patrimonio.tejada.ermita → leaf = "ermita"
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { CategoryOthersBreakdownViewProps } from "./CategoryOthersBreakdownView.types";
import CategoryOthersEmptyState from "./CategoryOthersEmptyState";
import CategoryOthersHeader from "./CategoryOthersHeader";
import { useCategoryOthersData } from "./useCategoryOthersData";

export default function CategoryOthersBreakdownView({
  categoryId,
  othersBreakdown,
  granularity,
  onBack,
}: CategoryOthersBreakdownViewProps) {
  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;

  // Transformar datos a formato ChartPair
  const { donutData, totalInteractions, categories, groupedSeries } =
    useCategoryOthersData({
      othersBreakdown,
      granularity,
    });

  if (othersBreakdown.length === 0) {
    return (
      <CategoryOthersEmptyState categoryLabel={categoryLabel} onBack={onBack} />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <CategoryOthersHeader
        categoryLabel={categoryLabel}
        totalInteractions={totalInteractions}
        onBack={onBack}
      />

      <ChartPair
        mode="grouped"
        categories={categories}
        groupedSeries={groupedSeries}
        chartTitle="Serie temporal"
        chartSubtitle={`${totalInteractions.toLocaleString()} interacciones totales`}
        donutData={donutData}
        deltaPct={null}
        donutCenterLabel="Interacciones"
        showActivityButton={false}
        granularity={granularity}
        tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
        yAxisFormatter={(val) => (val ?? 0).toString()}
        legendPosition="bottom"
        className=""
      />
    </div>
  );
}
