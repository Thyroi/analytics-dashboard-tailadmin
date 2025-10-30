interface ChartsPlaceholderProps {
  categoryLabel: string;
  granularity: string;
  categoryId: string;
}

export function ChartsPlaceholder({
  categoryLabel,
  granularity,
  categoryId,
}: ChartsPlaceholderProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Visualizaciones Detalladas</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          <h4 className="font-medium mb-4">📈 Tendencia Temporal</h4>
          <div className="h-64 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div>Gráfica de tendencia para {categoryLabel}</div>
              <div className="text-xs mt-1">Granularidad: {granularity}</div>
            </div>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          <h4 className="font-medium mb-4">🎯 Comparativa GA4 vs Chatbot</h4>
          <div className="h-64 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">⚖️</div>
              <div>Comparativa de fuentes para {categoryLabel}</div>
              <div className="text-xs mt-1">GA4 + Chatbot Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          💡 Debug Information
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p>
            Esta es la página de debug para categorías. Los gráficos detallados
            se implementarán según los requerimientos específicos.
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
  );
}
