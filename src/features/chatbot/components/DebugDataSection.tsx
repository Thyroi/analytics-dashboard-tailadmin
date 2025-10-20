/**
 * Componente de debug para mostrar datos raw del chatbot
 * Dos columnas: datos completos vs datos filtrados por categoría
 */

"use client";

import { useCategoryDrilldown } from "@/features/chatbot/hooks/useCategoryDrilldownReal";
import { useChatbotCategories } from "@/features/chatbot/hooks/useChatbotCategories";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useState } from "react";

type Props = {
  selectedCategoryId: CategoryId | null;
  granularity: Granularity;
  startDate: string | null;
  endDate: string | null;
};

export default function DebugDataSection({
  selectedCategoryId,
  granularity,
  startDate,
  endDate,
}: Props) {
  const [showDebug, setShowDebug] = useState(false);

  // Datos completos (todas las categorías)
  const { rawData: allRawData, aggregatedData: allAggregated } =
    useChatbotCategories({
      granularity,
      startDate,
      endDate,
    });

  // Datos filtrados por categoría seleccionada
  const categoryDrilldown = useCategoryDrilldown({
    categoryId: selectedCategoryId || "naturaleza", // fallback
    granularity,
    startDate,
    endDate,
    enabled: !!selectedCategoryId,
  });

  if (!showDebug) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowDebug(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          🔍 Mostrar Debug Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔍 Debug Data Comparison
        </h3>
        <button
          onClick={() => setShowDebug(false)}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
        >
          Ocultar
        </button>
      </div>

      {/* Parámetros actuales */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Parámetros de Query:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Granularidad:</span> {granularity}
          </div>
          <div>
            <span className="font-medium">Start:</span> {startDate || "null"}
          </div>
          <div>
            <span className="font-medium">End:</span> {endDate || "null"}
          </div>
          <div>
            <span className="font-medium">Categoría:</span>{" "}
            {selectedCategoryId || "ninguna"}
          </div>
        </div>
      </div>

      {/* Comparación en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Datos completos */}
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
              📊 Query Completa (Todas las categorías)
            </h4>

            {/* Raw Data */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Raw Data (Response completa):
              </h5>
              <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto border">
                <pre>{JSON.stringify(allRawData, null, 2)}</pre>
              </div>
            </div>

            {/* Aggregated Data */}
            <div>
              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Datos Agregados:
              </h5>
              <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto border">
                <pre>{JSON.stringify(allAggregated, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Datos filtrados por categoría */}
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
              🎯 Query Filtrada ({selectedCategoryId || "ninguna seleccionada"})
            </h4>

            {selectedCategoryId ? (
              <>
                {/* Status */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Estado del Hook:
                  </h5>
                  <div className="text-xs space-y-1">
                    <div>Status: {categoryDrilldown.status}</div>
                    <div>Loading: {categoryDrilldown.isLoading.toString()}</div>
                    <div>Error: {categoryDrilldown.isError.toString()}</div>
                    <div>
                      Total Interactions: {categoryDrilldown.totalInteractions}
                    </div>
                    <div>
                      Subcategorías: {categoryDrilldown.subcategories.length}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {categoryDrilldown.error && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Error:
                    </h5>
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs text-red-800 dark:text-red-200">
                      {categoryDrilldown.error.message}
                    </div>
                  </div>
                )}

                {/* Raw Data de la categoría */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Subcategorías ({categoryDrilldown.subcategories.length}):
                  </h5>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto border">
                    <pre>
                      {JSON.stringify(categoryDrilldown.subcategories, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Donut Data */}
                <div>
                  <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Donut Data ({categoryDrilldown.donutData.length}):
                  </h5>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto border">
                    <pre>
                      {JSON.stringify(categoryDrilldown.donutData, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-purple-600 dark:text-purple-300 text-sm text-center py-8">
                Selecciona una categoría para ver sus datos filtrados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
