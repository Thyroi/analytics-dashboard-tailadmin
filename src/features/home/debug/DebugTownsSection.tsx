"use client";

import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import { getTownLabel, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

interface DebugTownsSectionProps {
  granularity: Granularity;
}

export function DebugTownsSection({ granularity }: DebugTownsSectionProps) {
  // USAR CÁLCULO AUTOMÁTICO CORRECTO - SIN FECHAS HARDCODEADAS
  const hookParams = { granularity };

  // Obtener datos combinados para las cards de totales
  const { data: townsData, isLoading, error } = useResumenTown(hookParams);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando datos de pueblos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">
          Error cargando datos: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Debug de Pueblos - {granularity}
        </h1>
        <p className="text-gray-600 mb-4">
          Mostrando todos los valores de GA4 y Chatbot para cada pueblo
        </p>

        {/* Información de Rangos de Fechas */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            � Parámetros enviados a las APIs (SINCRONIZADO):
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

      {/* Grid de Cards por Pueblo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {townsData.map((townData) => (
          <div
            key={townData.id}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
          >
            {/* Nombre del Pueblo */}
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center border-b pb-2">
              {getTownLabel(townData.id as TownId)}
            </h2>

            {/* Los 4 Valores */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  GA4 Current
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {townData.ga4Total.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  GA4 Previous
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {townData.ga4Previous.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Chatbot Current
                </p>
                <p className="text-lg font-bold text-green-900">
                  {townData.chatbotTotal.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Chatbot Previous
                </p>
                <p className="text-lg font-bold text-green-800">
                  {townData.chatbotPrevious.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Porcentaje Delta */}
            <div
              className={`p-4 rounded-lg text-center ${
                townData.combinedDeltaPct === null
                  ? "bg-gray-50"
                  : townData.combinedDeltaPct >= 0
                  ? "bg-emerald-50"
                  : "bg-red-50"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  townData.combinedDeltaPct === null
                    ? "text-gray-600"
                    : townData.combinedDeltaPct >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                Delta Combinado
              </p>
              <p
                className={`text-2xl font-bold ${
                  townData.combinedDeltaPct === null
                    ? "text-gray-900"
                    : townData.combinedDeltaPct >= 0
                    ? "text-emerald-900"
                    : "text-red-900"
                }`}
              >
                {townData.combinedDeltaPct === null
                  ? "N/A"
                  : `${
                      townData.combinedDeltaPct >= 0 ? "+" : ""
                    }${townData.combinedDeltaPct.toFixed(1)}%`}
              </p>
            </div>

            {/* Totales Combinados */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-center">
              <p className="text-xs text-gray-600">
                Total Current: {townData.combinedTotal.toLocaleString()} | Total
                Previous:{" "}
                {(
                  townData.ga4Previous + townData.chatbotPrevious
                ).toLocaleString()}
              </p>
            </div>

            {/* JSON Debug Info */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                🔍 Ver JSON Debug
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(townData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* JSON Global Debug */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <details>
          <summary className="cursor-pointer font-semibold text-yellow-800 hover:text-yellow-900">
            🐛 Ver JSON Completo de Todos los Pueblos
          </summary>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(townsData, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

export default DebugTownsSection;
