"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import type { Granularity } from "@/lib/types";
import { getCorrectDatesForGranularity } from "@/lib/utils/time/deltaDateCalculation";
import { useState } from "react";

export default function DebugPage() {
  // Estado para controlar la granularidad y fechas
  const [mode, setMode] = useState<"granularity" | "range">("granularity");
  const [granularity, setGranularity] = useState<Granularity>("d");
  const [startDate, setStartDate] = useState<Date>(() => {
    // Simular el contexto TagTimeframe: terminar en ayer por defecto
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    // Simular el contexto TagTimeframe: terminar en ayer por defecto
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  });

  // Simular la lógica de getCorrectDatesForGranularity
  const { currentEndISO } = getCorrectDatesForGranularity(
    endDate,
    granularity,
    mode
  );

  // Convertir fechas a strings para el hook
  const startDateStr =
    mode === "range" ? startDate.toISOString().split("T")[0] : undefined;
  const endDateStr =
    mode === "range" ? endDate.toISOString().split("T")[0] : currentEndISO;

  // Obtener datos de towns con los parámetros
  const townHookResult = useResumenTown({
    granularity,
    startDate: startDateStr || null,
    endDate: endDateStr || null,
  });

  // Handlers para el sticky header
  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
    setMode("granularity");

    // Simular preset del contexto TagTimeframe para nueva granularidad
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    setStartDate(yesterday);
    setEndDate(yesterday);
  };

  const handleRangeChange = (start: Date, end: Date) => {
    // Clamp end to yesterday (como hace el contexto TagTimeframe)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const clampedEnd = end > yesterday ? yesterday : end;
    const clampedStart = start > clampedEnd ? clampedEnd : start;

    setStartDate(clampedStart);
    setEndDate(clampedEnd);
    setMode("range");
  };

  const handleClearRange = () => {
    setMode("granularity");

    // Volver al preset por granularidad
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    setStartDate(yesterday);
    setEndDate(yesterday);
  };

  return (
    <div>
      {/* Sticky Header con controles */}
      <StickyHeaderSection
        title="Debug - Towns Data"
        subtitle="useResumenTown Hook Testing"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={handleGranularityChange}
        onRangeChange={handleRangeChange}
        onClearRange={handleClearRange}
      />

      {/* Contenido principal */}
      <div className="p-6">
        {/* Estado de carga y errores */}
        {townHookResult.isLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300">
              🔄 Cargando datos...
            </p>
          </div>
        )}

        {townHookResult.isError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300">
              ❌ Error: {String(townHookResult.error)}
            </p>
          </div>
        )}

        {/* Información de debug */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Debug Page Params:</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Modo:</strong> {mode}
            </p>
            <p>
              <strong>Granularidad:</strong> {granularity}
            </p>
            {mode === "range" && (
              <>
                <p>
                  <strong>Start Date:</strong>{" "}
                  {startDate.toISOString().split("T")[0]}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {endDate.toISOString().split("T")[0]}
                </p>
              </>
            )}
            <p>
              <strong>Start Date Str:</strong> {startDateStr || "undefined"}
            </p>
            <p>
              <strong>End Date Str:</strong> {endDateStr}
            </p>
            <p>
              <strong>Current End ISO:</strong> {currentEndISO}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              ⚠️ Nota: En modo &quot;granularity&quot;, startDate se establece
              como undefined intencionalmente. La API debe calcular
              automáticamente el rango basado en granularity + endDate.
            </p>
          </div>
        </div>

        {/* Cards de Towns */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            🏘️ Towns Data Cards ({townHookResult.data.length} towns):
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {townHookResult.data.map((town) => (
              <div
                key={town.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border"
              >
                {/* Header con nombre del town */}
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {town.title}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {town.id}
                  </span>
                </div>

                {/* Datos vacíos por ahora */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      GA4 Current:
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {town.ga4Total}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      GA4 Previous:
                    </span>
                    <span className="font-semibold text-blue-500 dark:text-blue-300">
                      {town.ga4Previous.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      Chatbot Current:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {town.chatbotTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      Chatbot Previous:
                    </span>
                    <span className="font-semibold text-green-500 dark:text-green-300">
                      {town.chatbotPrevious.toLocaleString()}
                    </span>
                  </div>

                  {/* Separator */}
                  <hr className="border-gray-200 dark:border-gray-600 my-2" />

                  {/* Combined Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      Combined:
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {town.combinedTotal}
                    </span>
                  </div>

                  {/* Delta */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      Delta:
                    </span>
                    <span className="font-semibold text-gray-500">
                      {town.combinedDelta}
                    </span>
                  </div>

                  {/* Delta Percentage */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      Delta %:
                    </span>
                    <span className="font-semibold text-gray-500">
                      {town.combinedDeltaPct
                        ? `${town.combinedDeltaPct.toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Info Detallado */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-2">🔧 Hook Basic Info:</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Granularidad:</strong> {granularity}
            </p>
            <p>
              <strong>Start Date (input):</strong> {startDateStr || "undefined"}
            </p>
            <p>
              <strong>End Date (input):</strong> {endDateStr || "undefined"}
            </p>
            <p>
              <strong>Total Towns:</strong> {townHookResult.data.length}
            </p>
            <p>
              <strong>Loading:</strong> {String(townHookResult.isLoading)}
            </p>
            <p>
              <strong>Error:</strong> {String(townHookResult.isError)}
            </p>
            <p>
              <strong>Towns with data:</strong>{" "}
              {townHookResult.data.filter((t) => t.combinedTotal > 0).length}
            </p>
          </div>
        </div>

        {/* Estado completo del Hook */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            🔍 Hook State Completo:
          </h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <pre className="text-sm overflow-auto max-h-96 bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono">
              {JSON.stringify(townHookResult, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
