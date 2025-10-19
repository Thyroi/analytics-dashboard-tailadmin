"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import { getCategoryLabel } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useResumenCategory } from "../hooks/useResumenCategory";

interface CategoryDrilldownModalProps {
  categoryId: CategoryId;
  granularity: Granularity;
  onClose: () => void;
}

export default function CategoryDrilldownModal({
  categoryId,
  granularity,
  onClose,
}: CategoryDrilldownModalProps) {
  const categoryLabel = getCategoryLabel(categoryId);

  // Obtener totales de GA4 y Chatbot para mostrar en el subtítulo
  const { categoriesData } = useResumenCategory({ granularity });

  // Buscar los datos específicos de esta categoría
  const categoryData = categoriesData.find(
    (item) => item.categoryId === categoryId
  );

  // Calcular totales para el subtítulo
  const ga4Total = categoryData?.ga4Value || 0;
  const chatbotTotal = categoryData?.chatbotValue || 0;
  const combinedTotal = ga4Total + chatbotTotal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Drilldown: {categoryLabel}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Categoría: {categoryId} | Granularidad: {granularity}
              </p>
              {/* Subtítulo con totales de GA4, Chatbot y Total */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                GA4: {ga4Total.toLocaleString()} • Chatbot:{" "}
                {chatbotTotal.toLocaleString()} • Total:{" "}
                {combinedTotal.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          {/* Content */}
          <div className="p-6">
            {/* Category Info */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">
                📊 Información de la Categoría
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ID:</span>
                  <div className="font-mono">{categoryId}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Nombre:
                  </span>
                  <div className="font-medium">{categoryLabel}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Granularidad:
                  </span>
                  <div className="font-mono">{granularity}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Estado:
                  </span>
                  <div className="text-green-600 font-medium">Debug Mode</div>
                </div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Visualizaciones Detalladas
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  <h4 className="font-medium mb-4">📈 Tendencia Temporal</h4>
                  <div className="h-64 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <div>Gráfica de tendencia para {categoryLabel}</div>
                      <div className="text-xs mt-1">
                        Granularidad: {granularity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2 Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  <h4 className="font-medium mb-4">
                    🎯 Comparativa GA4 vs Chatbot
                  </h4>
                  <div className="h-64 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">⚖️</div>
                      <div>Comparativa de fuentes para {categoryLabel}</div>
                      <div className="text-xs mt-1">GA4 + Chatbot Data</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  💡 Debug Information
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Esta es la página de debug para categorías. Los gráficos
                    detallados se implementarán según los requerimientos
                    específicos.
                  </p>
                  <p className="mt-1">
                    Categoría seleccionada:{" "}
                    <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                      {categoryId}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
