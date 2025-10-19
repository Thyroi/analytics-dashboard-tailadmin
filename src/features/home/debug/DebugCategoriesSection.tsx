"use client";

import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

interface DebugCategoriesSectionProps {
  granularity: Granularity;
}

export function DebugCategoriesSection({
  granularity,
}: DebugCategoriesSectionProps) {
  // USAR CÁLCULO AUTOMÁTICO CORRECTO - SIN FECHAS HARDCODEADAS
  const hookParams = { granularity };

  // Obtener datos combinados para las cards de totales
  const { categoriesData } = useResumenCategory(hookParams);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Debug de Categorías - {granularity}
        </h1>
        <p className="text-gray-600 mb-4">
          Mostrando todos los valores de GA4 y Chatbot para cada categoría
        </p>

        {/* Información de Rangos de Fechas */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            📅 Parámetros enviados a las APIs (SINCRONIZADO):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Granularidad:</strong>{" "}
              <code className="bg-green-100 px-1 rounded">{granularity}</code>
            </div>
            <div>
              <strong>Fecha actual:</strong>{" "}
              <code className="bg-green-100 px-1 rounded">
                {new Date().toISOString().split("T")[0]}
              </code>
            </div>
            <div className="md:col-span-2">
              <strong>Start Date:</strong>{" "}
              <code className="bg-green-100 px-1 rounded">
                Calculado automáticamente (ayer)
              </code>
            </div>
            <div className="md:col-span-2">
              <strong>End Date:</strong>{" "}
              <code className="bg-green-100 px-1 rounded">
                Calculado automáticamente (ayer)
              </code>
            </div>
            <div className="md:col-span-2 text-green-700">
              <strong>✅ CORREGIDO:</strong> Endpoint calcula Current=ayer,
              Previous=anteayer automáticamente
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Cards por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categoriesData.map((categoryData) => (
          <div
            key={categoryData.categoryId}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
          >
            {/* Nombre de la Categoría */}
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center border-b pb-2">
              {CATEGORY_META[categoryData.categoryId].label}
            </h2>

            {/* Los 4 Valores */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  GA4 Current
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {categoryData.ga4Value.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  GA4 Previous
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {categoryData.ga4PrevValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Chatbot Current
                </p>
                <p className="text-lg font-bold text-green-900">
                  {categoryData.chatbotValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Chatbot Previous
                </p>
                <p className="text-lg font-bold text-green-800">
                  {categoryData.chatbotPrevValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Porcentaje Delta */}
            <div
              className={`p-4 rounded-lg text-center ${
                categoryData.delta === null
                  ? "bg-gray-50"
                  : categoryData.delta >= 0
                  ? "bg-emerald-50"
                  : "bg-red-50"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  categoryData.delta === null
                    ? "text-gray-600"
                    : categoryData.delta >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                Delta Combinado
              </p>
              <p
                className={`text-2xl font-bold ${
                  categoryData.delta === null
                    ? "text-gray-900"
                    : categoryData.delta >= 0
                    ? "text-emerald-900"
                    : "text-red-900"
                }`}
              >
                {categoryData.delta === null
                  ? "N/A"
                  : `${categoryData.delta >= 0 ? "+" : ""}${
                      categoryData.delta
                    }%`}
              </p>
            </div>

            {/* Totales Combinados */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-center">
              <p className="text-xs text-gray-600">
                Total Current:{" "}
                {(
                  categoryData.ga4Value + categoryData.chatbotValue
                ).toLocaleString()}{" "}
                | Total Previous:{" "}
                {(
                  categoryData.ga4PrevValue + categoryData.chatbotPrevValue
                ).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
