/**
 * Componente demo completo que muestra:
 * 1. Grid de categorías (ChatbotCategoriesSection)
 * 2. Drilldown con datos reales basados en fechas
 * 3. Gráfico GroupedBar actualizado
 */

"use client";

import { TagTimeProvider } from "@/features/analytics/context/TagTimeContext";
import { useState } from "react";
import ChatbotCategoriesSection from "./ChatbotCategoriesSection";
import DateBasedGroupedBarDemo from "./DateBasedGroupedBarDemo";

type ViewMode = "categories" | "demo" | "integrated";

export default function CompleteIntegrationDemo() {
  const [currentView, setCurrentView] = useState<ViewMode>("categories");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              🚀 Chatbot Analytics - Integración Completa
            </h1>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView("categories")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "categories"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                📊 Categorías
              </button>
              <button
                onClick={() => setCurrentView("demo")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "demo"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                🧪 Demo Gráfico
              </button>
              <button
                onClick={() => setCurrentView("integrated")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "integrated"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                🔗 Flujo Completo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="py-8">
        {currentView === "categories" && (
          <div className="space-y-6">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📊 Vista de Categorías
                </h2>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Haz clic en cualquier categoría para ver el drilldown con
                  gráfico basado en fechas reales.
                </p>
              </div>
            </div>

            <TagTimeProvider>
              <ChatbotCategoriesSection />
            </TagTimeProvider>
          </div>
        )}

        {currentView === "demo" && (
          <div className="space-y-6">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 mb-6">
                <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  🧪 Demo del Nuevo Gráfico
                </h2>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Visualización de cómo se ven los datos reales del API en el
                  GroupedBarChart actualizado.
                </p>
              </div>
            </div>

            <DateBasedGroupedBarDemo />
          </div>
        )}

        {currentView === "integrated" && (
          <div className="space-y-6">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 mb-6">
                <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🔗 Flujo de Integración Completa
                </h2>
                <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                  Workflow completo: Categorías → Click → Drilldown con datos
                  reales por fechas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      1. Grid de Categorías
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      DeltaCards con datos agregados
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      2. Click Categoría
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Transición al drilldown
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      3. Gráfico por Fechas
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Barras = subcategorías en sus fechas
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <TagTimeProvider>
              <ChatbotCategoriesSection />
            </TagTimeProvider>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              ✅ <strong>Funcionalidades implementadas:</strong>
              Grid de categorías • Drilldown interactivo • Gráfico basado en
              fechas reales • Hook con React Query • API con datos reales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
