/**
 * Componente debug para probar el cálculo de fechas
 */

"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { DateRangeProvider, useDateRange } from "../context/DateRangeContext";
import { useDebugFechas } from "../hooks/useDebugFechas";

function DebugFechasContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    getCurrentPeriod,
    getPreviousPeriod,
    getCalculatedGranularity,
    getDurationDays,
  } = useDateRange();

  const { data, isLoading, error, refetch } = useDebugFechas();

  const currentPeriod = getCurrentPeriod();
  const previousPeriod = getPreviousPeriod();
  const calculatedGranularity = getCalculatedGranularity();
  const durationDays = getDurationDays();

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Debug · Cálculo de Fechas"
        subtitle="Prueba la nueva lógica de rangos y granularidad automática"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <div className="px-4 space-y-6">
        {/* Información del contexto */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Información del Contexto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Modo
              </label>
              <p className="text-lg font-mono text-gray-900 dark:text-white">
                {mode}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Granularidad Manual
              </label>
              <p className="text-lg font-mono text-gray-900 dark:text-white">
                {granularity}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Granularidad Calculada
              </label>
              <p className="text-lg font-mono text-gray-900 dark:text-white">
                {calculatedGranularity}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Duración (días)
              </label>
              <p className="text-lg font-mono text-gray-900 dark:text-white">
                {durationDays}
              </p>
            </div>
          </div>
        </div>

        {/* Períodos calculados */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Períodos Calculados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Período Actual
              </label>
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border">
                <p className="font-mono text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    Inicio:
                  </span>{" "}
                  {currentPeriod.start}
                </p>
                <p className="font-mono text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    Fin:
                  </span>{" "}
                  {currentPeriod.end}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Período Anterior
              </label>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                <p className="font-mono text-sm">
                  <span className="text-blue-700 dark:text-blue-300">
                    Inicio:
                  </span>{" "}
                  {previousPeriod.start}
                </p>
                <p className="font-mono text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Fin:</span>{" "}
                  {previousPeriod.end}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de la query */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Respuesta de la API
            </h3>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Cargando..." : "Refrescar"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-red-700 dark:text-red-300 font-medium">
                Error:
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm font-mono">
                {error.message}
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Cargando datos...
              </span>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Resumen
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Eventos Actuales:
                    </span>
                    <span className="ml-2 font-mono font-medium">
                      {data.debug.summary.totalCurrentEvents.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Eventos Anteriores:
                    </span>
                    <span className="ml-2 font-mono font-medium">
                      {data.debug.summary.totalPreviousEvents.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Categorías con Datos:
                    </span>
                    <span className="ml-2 font-mono font-medium">
                      {data.debug.summary.categoriesWithData}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Filas GA4:
                    </span>
                    <span className="ml-2 font-mono font-medium">
                      {data.debug.ga4Response.totalRows}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON completo */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Respuesta Completa (JSON)
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function DebugFechasSection() {
  return (
    <DateRangeProvider initialMode="granularity" initialGranularity="d">
      <DebugFechasContent />
    </DateRangeProvider>
  );
}
