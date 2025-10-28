"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";

interface DebugCategoryDetailProps {
  categoryId: CategoryId | null;
  ga4Data: unknown;
  chatbotData: unknown;
  ga4RawQuery: unknown;
  chatbotRawQuery: unknown;
}

export default function DebugCategoryDetail({
  categoryId,
  ga4Data,
  chatbotData,
  ga4RawQuery,
  chatbotRawQuery,
}: DebugCategoryDetailProps) {
  const [showGA4Full, setShowGA4Full] = useState(false);
  const [showChatbotFull, setShowChatbotFull] = useState(false);

  if (!categoryId) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500 dark:text-gray-400">
        Selecciona una categoría para ver los detalles de las queries
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        📊 Detalles de Query para: {categoryId}
      </h3>

      {/* Grid de 2 columnas para GA4 y Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GA4 Data */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">
              🔵 GA4 Data
            </h4>
            <button
              onClick={() => setShowGA4Full(!showGA4Full)}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {showGA4Full ? "Ver Filtrado" : "Ver Query Completa"}
            </button>
          </div>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-100 dark:bg-gray-900 p-3 rounded font-mono">
            {JSON.stringify(showGA4Full ? ga4RawQuery : ga4Data, null, 2)}
          </pre>
        </div>

        {/* Chatbot Data */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-green-600 dark:text-green-400">
              🟢 Chatbot Data
            </h4>
            <button
              onClick={() => setShowChatbotFull(!showChatbotFull)}
              className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              {showChatbotFull ? "Ver Filtrado" : "Ver Query Completa"}
            </button>
          </div>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-100 dark:bg-gray-900 p-3 rounded font-mono">
            {JSON.stringify(
              showChatbotFull ? chatbotRawQuery : chatbotData,
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
