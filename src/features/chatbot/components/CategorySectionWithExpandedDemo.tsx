/**
 * Demo completo que muestra el nuevo comportamiento similar a SectorExpandedCard:
 * 1. Cards siempre visibles
 * 2. TopCategoriesKPI entre header y cards
 * 3. Drilldown expandido como overlay al hacer click
 * 4. Card seleccionada resaltada
 */

"use client";

import { TagTimeProvider } from "@/features/analytics/context/TagTimeContext";
import ChatbotCategoriesSection from "./ChatbotCategoriesSection";

export default function CategorySectionWithExpandedDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Header informativo */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-3">
            🏗️ Categorías con Drilldown Expandido
          </h1>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Nuevo comportamiento similar a <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-sm">SectorExpandedCard</code>:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <span className="text-lg">📊</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">1. Top KPIs</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                TopCategoriesKPI entre header y categorías
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <span className="text-lg">🎯</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">2. Cards Visibles</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Grid siempre visible con selección resaltada
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <span className="text-lg">📈</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">3. Drilldown Overlay</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                CategoryExpandedCard como overlay
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <span className="text-lg">📅</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">4. Gráfico Fechas</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Eje X = fechas, barras = subcategorías
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800 rounded border-l-4 border-blue-500">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>💡 Cómo probar:</strong> 
              Haz clic en cualquier categoría para ver el drilldown expandido. 
              La card se resaltará y aparecerá el gráfico con datos por fechas encima del grid.
            </p>
          </div>
        </div>
      </div>
      
      {/* Componente principal */}
      <TagTimeProvider>
        <ChatbotCategoriesSection />
      </TagTimeProvider>
      
      {/* Footer explicativo */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Características implementadas:
          </h3>
          <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
            <li>• <strong>TopCategoriesKPI</strong> integrado entre StickyHeader y grid de categorías</li>
            <li>• <strong>CategoryExpandedCard</strong> con estilo similar a SectorExpandedCard</li>
            <li>• <strong>Cards siempre visibles</strong> con selección resaltada (ring azul)</li>
            <li>• <strong>Drilldown como overlay</strong> que se muestra arriba del grid</li>
            <li>• <strong>Subtítulo en header</strong> con "Análisis detallado por subcategorías • X interacciones totales"</li>
            <li>• <strong>Gráfico por fechas</strong> en eje X con barras por subcategoría</li>
          </ul>
        </div>
      </div>
    </div>
  );
}