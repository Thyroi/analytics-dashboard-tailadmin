"use client";

import { useState } from "react";
import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import CategoryGrid from "@/features/home/components/CategoryGrid";
import CategoryDrilldownModal from "@/features/home/components/CategoryDrilldownModal";
import type { Granularity } from "@/lib/types";
import type { CategoryId } from "@/lib/taxonomy/categories";

interface DebugCategoriesSectionContentProps {
  granularity: Granularity;
}

export default function DebugCategoriesSectionContent({
  granularity,
}: DebugCategoriesSectionContentProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  
  // Usar el hook de categorías
  const categoryResumenResult = useResumenCategory({ granularity });

  // Transformar datos al formato que espera CategoryGrid
  const transformedData = categoryResumenResult.categoriesData.map((category) => ({
    categoryId: category.categoryId,
    ga4Value: category.ga4Value,
    chatbotValue: category.chatbotValue,
    combinedValue: category.ga4Value + category.chatbotValue,
    deltaPercentage: category.delta,
  }));

  const handleCategoryClick = (categoryId: CategoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCloseDrilldown = () => {
    setSelectedCategoryId(null);
  };

  if (categoryResumenResult.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando datos de categorías...</div>
      </div>
    );
  }

  if (categoryResumenResult.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">
          Error cargando datos: {categoryResumenResult.error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📊 Debug Stats - Categorías</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Categories:</span>
            <div className="font-mono">{transformedData.length}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Categories with Data:</span>
            <div className="font-mono">
              {transformedData.filter(c => c.combinedValue > 0).length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Granularity:</span>
            <div className="font-mono">{granularity}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
            <div className="font-mono text-green-600">2 (optimized!)</div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <CategoryGrid
        data={transformedData}
        onCategoryClick={handleCategoryClick}
        isLoading={categoryResumenResult.isLoading}
      />

      {/* Drilldown Modal */}
      {selectedCategoryId && (
        <CategoryDrilldownModal
          categoryId={selectedCategoryId}
          granularity={granularity}
          onClose={handleCloseDrilldown}
        />
      )}
    </div>
  );
}