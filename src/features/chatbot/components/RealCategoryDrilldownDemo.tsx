/**
 * Ejemplo completo del sistema de drilldown real de categorías
 * Muestra la integración entre el grid de categorías y el drilldown con datos reales
 */

"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import { useState } from "react";
import { useCategoryDrilldown } from "../hooks/useCategoryDrilldownReal";
import CategoryDrilldownView from "./CategoryDrilldownView";

export default function RealCategoryDrilldownDemo() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null
  );

  // Si hay categoría seleccionada, mostrar drilldown
  if (selectedCategory) {
    return (
      <CategoryDrilldownView
        categoryId={selectedCategory}
        granularity="d"
        onBack={() => setSelectedCategory(null)}
        onSubcategoryClick={(subcategory) => {
          console.log("Navigate to subcategory:", subcategory);
          // TODO: Implementar siguiente nivel de drilldown
        }}
      />
    );
  }

  // Grid de categorías disponibles
  return (
    <div className="max-w-[1560px] mx-auto w-full space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Demo: Sistema Real de Drilldown
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Selecciona una categoría para ver su drilldown con datos reales del
          API
        </p>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORY_ID_ORDER.map((categoryId) => (
          <CategoryCard
            key={categoryId}
            categoryId={categoryId}
            onClick={() => setSelectedCategory(categoryId)}
          />
        ))}
      </div>

      {/* Info sobre la implementación */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          🔧 Características del Sistema
        </h3>
        <ul className="text-blue-600 dark:text-blue-300 space-y-2">
          <li>
            ✅ <strong>Query real</strong>: `root.{"{categoryId}"}.*.*`
          </li>
          <li>
            ✅ <strong>Granularidad siempre &quot;d&quot;</strong> en la query
            (fechas varían según usuario)
          </li>
          <li>
            ✅ <strong>React Query</strong> para cache y estado
          </li>
          <li>
            ✅ <strong>Compatible con range picker</strong> (startDate/endDate)
          </li>
          <li>
            ✅ <strong>Detección automática de sub-niveles</strong> (hasChildren
            flag)
          </li>
          <li>
            ✅ <strong>ChartPair con GroupedBarChart</strong> + DonutChart
          </li>
        </ul>
      </div>
    </div>
  );
}

type CategoryCardProps = {
  categoryId: CategoryId;
  onClick: () => void;
};

function CategoryCard({ categoryId, onClick }: CategoryCardProps) {
  const categoryMeta = CATEGORY_META[categoryId];

  // Usar el hook para obtener un preview de datos (opcional)
  const { totalInteractions, isLoading, subcategories } = useCategoryDrilldown({
    categoryId,
    granularity: "d",
    enabled: false, // Disabled por defecto para no hacer queries innecesarias
  });

  return (
    <button
      onClick={onClick}
      className="group p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg text-left"
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-lg font-semibold">
            {categoryMeta.label.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {categoryMeta.label}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {categoryId}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total interacciones
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {isLoading ? "..." : totalInteractions.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Subcategorías
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {isLoading ? "..." : subcategories.length}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Haz clic para ver drilldown
          </span>
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}
