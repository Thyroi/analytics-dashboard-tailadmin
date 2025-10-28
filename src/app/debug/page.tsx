"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import DebugCategoryCharts from "@/components/debug/DebugCategoryCharts";
import DebugCategoryDetail from "@/components/debug/DebugCategoryDetail";
import DebugTabs, { type TabId } from "@/components/debug/DebugTabs";
import DebugTownCharts from "@/components/debug/DebugTownCharts";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import { useCategoriaDetails } from "@/features/analytics/hooks/categorias/useCategoriaDetails";
import { useCategoryTownBreakdownRaw } from "@/features/chatbot/hooks/useCategoryTownBreakdownRaw";
import { useChatbotCategoryTotals } from "@/features/chatbot/hooks/useChatbotCategoryTotals";
import { useCombinedTownCategoryBreakdown } from "@/features/home/hooks/useCombinedTownCategoryBreakdown";
import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_META } from "@/lib/taxonomy/towns";
import type { DonutDatum } from "@/lib/types";
import { useMemo, useState } from "react";

// Componente para la pestaña de Towns
function DebugTownsTab() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    getCurrentPeriod,
  } = useTownTimeframe();

  const { start: startDateStr, end: endDateStr } = getCurrentPeriod();
  const [selectedTown, setSelectedTown] = useState<TownId | null>(null);

  const townHookResult = useResumenTown({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  // Hook combinado para el town seleccionado
  const townDetailsResult = useCombinedTownCategoryBreakdown(
    selectedTown,
    granularity,
    startDateStr,
    endDateStr
  );

  // Extraer datos del hook combinado
  const ga4Series = townDetailsResult.ga4Result.series || {
    current: [],
    previous: [],
  };
  const chatbotSeries = townDetailsResult.chatbotResult.series || {
    current: [],
    previous: [],
  };
  const combinedSeries = townDetailsResult.series;

  const ga4DonutData = townDetailsResult.ga4Result.donutData || [];
  const chatbotDonutData = townDetailsResult.chatbotResult.donutData || [];
  const combinedDonutData = townDetailsResult.donutData;

  return (
    <div>
      <StickyHeaderSection
        title="Debug - Towns Data"
        subtitle="useResumenTown Hook Testing"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <div className="p-6">
        {/* Estado de carga y errores */}
        {townHookResult.isLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300">
              🔄 Cargando datos...
            </p>
          </div>
        )}

        {townHookResult.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300">
              ❌ Error: {String(townHookResult.error)}
            </p>
          </div>
        )}

        {/* Información detallada de las queries de Towns */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GA4 Towns Query Info */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
              🔵 GA4 Query (Towns Totals)
            </h4>
            <div className="text-xs space-y-1">
              <p>
                <strong>Hook:</strong> useResumenTown
              </p>
              <p>
                <strong>Endpoint:</strong>{" "}
                /api/analytics/v1/dimensions/pueblos/totales
              </p>
              <p>
                <strong>Granularity:</strong> {granularity}
              </p>
              <p>
                <strong>Start Date:</strong> {startDateStr}
              </p>
              <p>
                <strong>End Date:</strong> {endDateStr}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {townHookResult.isLoading ? "Loading" : "Ready"}
              </p>
              <p>
                <strong>Items:</strong> {townHookResult.data.length}
              </p>
              <p className="text-gray-500 mt-2">
                💡 Los rangos de fecha se calculan automáticamente por el
                backend
              </p>
            </div>
          </div>

          {/* Chatbot Towns Query Info */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              🟢 Chatbot Query (Towns)
            </h4>
            <div className="text-xs space-y-1">
              <p>
                <strong>Hook:</strong> useResumenTown (internal)
              </p>
              <p>
                <strong>Endpoint:</strong> /api/chatbot/audit/tags
              </p>
              <p>
                <strong>Pattern:</strong> root.*.*.*
              </p>
              <p>
                <strong>Granularity:</strong> {granularity}
              </p>
              <p>
                <strong>Start Date:</strong> {startDateStr}
              </p>
              <p>
                <strong>End Date:</strong> {endDateStr}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {townHookResult.isLoading ? "Loading" : "Ready"}
              </p>
              <p className="text-gray-500 mt-2">
                💡 Los rangos se calculan con computeRangesForKPI
              </p>
            </div>
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
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border cursor-pointer transition-all ${
                  selectedTown === town.id
                    ? "ring-2 ring-purple-500 border-purple-500"
                    : "hover:border-gray-400"
                }`}
                onClick={() => setSelectedTown(town.id as TownId)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {town.title}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {town.id}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      GA4 Current:
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {town.ga4Total.toLocaleString()}
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
                  <hr className="border-gray-200 dark:border-gray-600 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      Combined:
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {town.combinedTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      Delta:
                    </span>
                    <span className="font-semibold text-gray-500">
                      {town.combinedDelta.toLocaleString()}
                    </span>
                  </div>
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

        {/* Detalle del Town seleccionado */}
        {selectedTown && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                📊 Detalle del Pueblo: {TOWN_META[selectedTown].label}
              </h3>

              {/* Alerta de datos sin categorizar */}
              {townDetailsResult.totalsInfo && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      ⚠️ GA4 - Datos sin categorizar
                    </h5>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Total en series:</strong>{" "}
                      {townDetailsResult.totalsInfo.ga4SeriesTotal}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Total en donut:</strong>{" "}
                      {townDetailsResult.totalsInfo.ga4DonutTotal}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-bold">
                      <strong>Sin categoría:</strong>{" "}
                      {townDetailsResult.totalsInfo.ga4Uncategorized}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      ⚠️ Chatbot - Datos sin categorizar
                    </h5>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Total en series:</strong>{" "}
                      {townDetailsResult.totalsInfo.chatbotSeriesTotal}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Total en donut:</strong>{" "}
                      {townDetailsResult.totalsInfo.chatbotDonutTotal}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-bold">
                      <strong>Sin categoría:</strong>{" "}
                      {townDetailsResult.totalsInfo.chatbotUncategorized}
                    </p>
                  </div>
                </div>
              )}

              {/* Cards de resumen de datos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* GA4 Donut */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    🔵 GA4 Donut Data
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Items:</strong> {ga4DonutData.length}
                    </p>
                    <p className="text-sm">
                      <strong>Total:</strong>{" "}
                      {ga4DonutData
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </p>
                    <div className="mt-3 max-h-40 overflow-auto text-xs space-y-1">
                      {ga4DonutData.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{item.label}</span>
                          <span className="font-mono ml-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chatbot Donut */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3">
                    🟢 Chatbot Donut Data
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Items:</strong> {chatbotDonutData.length}
                    </p>
                    <p className="text-sm">
                      <strong>Total:</strong>{" "}
                      {chatbotDonutData
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </p>
                    <div className="mt-3 max-h-40 overflow-auto text-xs space-y-1">
                      {chatbotDonutData.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{item.label}</span>
                          <span className="font-mono ml-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Combined Donut */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-3">
                    🟣 Combined Donut Data
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Items:</strong> {combinedDonutData.length}
                    </p>
                    <p className="text-sm">
                      <strong>Total:</strong>{" "}
                      {combinedDonutData
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </p>
                    <div className="mt-3 max-h-40 overflow-auto text-xs space-y-1">
                      {combinedDonutData.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{item.label}</span>
                          <span className="font-mono ml-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Series comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    🔵 GA4 Series
                  </h4>
                  <p className="text-sm">
                    <strong>Current points:</strong> {ga4Series.current.length}
                  </p>
                  <p className="text-sm">
                    <strong>Previous points:</strong>{" "}
                    {ga4Series.previous.length}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3">
                    🟢 Chatbot Series
                  </h4>
                  <p className="text-sm">
                    <strong>Current points:</strong>{" "}
                    {chatbotSeries.current.length}
                  </p>
                  <p className="text-sm">
                    <strong>Previous points:</strong>{" "}
                    {chatbotSeries.previous.length}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-3">
                    🟣 Combined Series
                  </h4>
                  <p className="text-sm">
                    <strong>Current points:</strong>{" "}
                    {combinedSeries.current.length}
                  </p>
                  <p className="text-sm">
                    <strong>Previous points:</strong>{" "}
                    {combinedSeries.previous.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <DebugTownCharts
                townId={selectedTown}
                granularity={granularity}
                ga4Series={ga4Series}
                chatbotSeries={chatbotSeries}
                combinedSeries={combinedSeries}
                ga4DonutData={ga4DonutData}
                chatbotDonutData={chatbotDonutData}
                combinedDonutData={combinedDonutData}
                ga4DeltaPct={null}
                chatbotDeltaPct={null}
                combinedDeltaPct={null}
              />
            </div>
          </>
        )}

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

// Componente para la pestaña de Categorías
function DebugCategoriesTab() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    getCurrentPeriod,
  } = useTagTimeframe();

  const { start: startDateStr, end: endDateStr } = getCurrentPeriod();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null
  );

  const categoryHookResult = useResumenCategory({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  // Hook específico para chatbot de categorías (usa pattern root.*.*)
  const chatbotCategoryTotals = useChatbotCategoryTotals({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const selectedCategoryDetails = useCategoriaDetails({
    categoryId: selectedCategory || "naturaleza",
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
    enabled: !!selectedCategory,
  });

  // Hook para el breakdown de towns dentro de la categoría (chatbot)
  // Versión RAW sin agrupamiento en "Otros" para poder combinar con GA4
  const selectedCategoryChatbotBreakdown = useCategoryTownBreakdownRaw({
    categoryId: selectedCategory || "naturaleza",
    startISO: startDateStr,
    endISO: endDateStr,
    windowGranularity: granularity,
    enabled: !!selectedCategory,
  });

  const chatbotSeries = useMemo(() => {
    if (!selectedCategoryChatbotBreakdown.data) {
      return { current: [], previous: [] };
    }

    // Usar las series ya calculadas por el servicio
    const current = selectedCategoryChatbotBreakdown.data.series?.current || [];
    const previous =
      selectedCategoryChatbotBreakdown.data.series?.previous || [];

    return { current, previous };
  }, [selectedCategoryChatbotBreakdown.data]);

  const chatbotDonutData: DonutDatum[] = useMemo(() => {
    if (!selectedCategoryChatbotBreakdown.data) {
      return [];
    }

    const towns = selectedCategoryChatbotBreakdown.data.towns || [];

    // Donut: participación por town (sin agrupar en "Otros")
    return towns
      .filter((town) => town.currentTotal > 0)
      .map((town) => ({
        label: town.label,
        value: town.currentTotal,
        color: undefined,
      }));
  }, [selectedCategoryChatbotBreakdown.data]);

  const combinedSeries = useMemo(() => {
    if (
      selectedCategoryDetails.status !== "ready" ||
      chatbotSeries.current.length === 0
    ) {
      return { current: [], previous: [] };
    }

    const ga4Map = new Map(
      selectedCategoryDetails.series.current.map((p) => [p.label, p.value])
    );
    const chatbotMap = new Map(
      chatbotSeries.current.map((p) => [p.label, p.value])
    );

    const allDates = new Set([
      ...selectedCategoryDetails.series.current.map((p) => p.label),
      ...chatbotSeries.current.map((p) => p.label),
    ]);

    const combinedCurrent = Array.from(allDates)
      .map((label) => ({
        label,
        value: (ga4Map.get(label) || 0) + (chatbotMap.get(label) || 0),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const ga4PrevMap = new Map(
      selectedCategoryDetails.series.previous.map((p) => [p.label, p.value])
    );
    const allPrevDates = new Set(
      selectedCategoryDetails.series.previous.map((p) => p.label)
    );

    const combinedPrevious = Array.from(allPrevDates)
      .map((label) => ({
        label,
        value: ga4PrevMap.get(label) || 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return { current: combinedCurrent, previous: combinedPrevious };
  }, [selectedCategoryDetails, chatbotSeries]);

  // Datos de donut para los charts
  const ga4DonutData: DonutDatum[] = useMemo(() => {
    return selectedCategoryDetails.status === "ready"
      ? selectedCategoryDetails.donutData
      : [];
  }, [selectedCategoryDetails.status, selectedCategoryDetails.donutData]);

  // Combinar donuts: GA4 + Chatbot sumando por label
  // IMPORTANTE: Normalizar labels para evitar duplicados de pueblos
  const combinedDonutData: DonutDatum[] = useMemo(() => {
    if (ga4DonutData.length === 0 && chatbotDonutData.length === 0) {
      return [];
    }

    // Función para normalizar labels (quitar acentos, lowercase, espacios)
    const normalizeLabel = (label: string): string => {
      return label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos
        .replace(/[._-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Crear un mapa para acumular valores por label normalizado
    // Guardamos también el label original (preferimos el de GA4 si existe)
    const labelMap = new Map<
      string,
      { originalLabel: string; value: number; sources: string[] }
    >();

    // Agregar valores de GA4
    ga4DonutData.forEach((item) => {
      const normalized = normalizeLabel(item.label);
      const existing = labelMap.get(normalized);
      if (existing) {
        existing.value += item.value;
        existing.sources.push("GA4");
      } else {
        labelMap.set(normalized, {
          originalLabel: item.label, // Preferir label de GA4
          value: item.value,
          sources: ["GA4"],
        });
      }
    });

    // Agregar valores de Chatbot
    chatbotDonutData.forEach((item) => {
      const normalized = normalizeLabel(item.label);
      const existing = labelMap.get(normalized);
      if (existing) {
        // Ya existe (probablemente un pueblo), sumar el valor
        existing.value += item.value;
        existing.sources.push("Chatbot");
      } else {
        // No existe, agregar nuevo
        labelMap.set(normalized, {
          originalLabel: item.label,
          value: item.value,
          sources: ["Chatbot"],
        });
      }
    });

    // Convertir el mapa a array de DonutDatum y ordenar por valor descendente
    return Array.from(labelMap.values())
      .map((item) => ({
        label: item.originalLabel,
        value: item.value,
        color: undefined,
      }))
      .sort((a, b) => b.value - a.value);
  }, [ga4DonutData, chatbotDonutData]);

  return (
    <div>
      <StickyHeaderSection
        title="Debug - Categorías Data"
        subtitle="useResumenCategory Hook Testing"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <div className="p-6">
        {categoryHookResult.isLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300">
              🔄 Cargando datos...
            </p>
          </div>
        )}

        {categoryHookResult.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300">
              ❌ Error: {String(categoryHookResult.error)}
            </p>
          </div>
        )}

        {/* Información de debug de queries */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Query Parameters:</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Modo:</strong> {mode}
            </p>
            <p>
              <strong>Granularidad:</strong> {granularity}
            </p>
            <p>
              <strong>Start Date Str:</strong> {startDateStr || "undefined"}
            </p>
            <p>
              <strong>End Date Str:</strong> {endDateStr}
            </p>
          </div>
        </div>

        {/* Información detallada de las queries */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GA4 Query Info */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
              🔵 GA4 Query (useCategoriesTotalsNew)
            </h4>
            <div className="text-xs space-y-1">
              <p>
                <strong>Hook:</strong> useResumenCategory
              </p>
              <p>
                <strong>Granularity:</strong> {granularity}
              </p>
              <p>
                <strong>Start Date:</strong> {startDateStr}
              </p>
              <p>
                <strong>End Date:</strong> {endDateStr}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {categoryHookResult.isLoading ? "Loading" : "Ready"}
              </p>
              <p>
                <strong>Items:</strong>{" "}
                {categoryHookResult.categoriesData.length}
              </p>
              {categoryHookResult.rawQuery && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                    Ver calculation info
                  </summary>
                  <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                    {JSON.stringify(
                      categoryHookResult.rawQuery?.calculation,
                      null,
                      2
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* Chatbot Query Info */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
              🟢 Chatbot Query (useChatbotCategoryTotals)
            </h4>
            <div className="text-xs space-y-1">
              <p>
                <strong>Hook:</strong> useChatbotCategoryTotals
              </p>
              <p>
                <strong>Pattern:</strong> root.*.* (solo profundidad 2)
              </p>
              <p>
                <strong>Lógica:</strong> Solo cuenta keys
                root.&#123;categoryId&#125;
              </p>
              <p>
                <strong>Granularity:</strong> {granularity}
              </p>
              <p>
                <strong>Start Date:</strong> {startDateStr}
              </p>
              <p>
                <strong>End Date:</strong> {endDateStr}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {chatbotCategoryTotals.isLoading ? "Loading" : "Ready"}
              </p>
              <p>
                <strong>Categories:</strong>{" "}
                {chatbotCategoryTotals.categories.length}
              </p>
              {chatbotCategoryTotals.meta && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-green-600 dark:text-green-400">
                    Ver meta info
                  </summary>
                  <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                    {JSON.stringify(chatbotCategoryTotals.meta, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Categorías */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            🏷️ Categories Data Cards ({categoryHookResult.categoriesData.length}{" "}
            categorías):
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {CATEGORY_ID_ORDER.map((categoryId) => {
              const category = categoryHookResult.categoriesData.find(
                (c) => c.categoryId === categoryId
              );
              const chatbot = chatbotCategoryTotals.categories.find(
                (c) => c.id === categoryId
              );

              if (!category) return null;

              return (
                <div
                  key={categoryId}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border hover:border-purple-500 cursor-pointer transition-colors"
                  onClick={() => setSelectedCategory(categoryId)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {CATEGORY_META[categoryId].label}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {categoryId}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* GA4 */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        GA4 Current:
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {category.ga4Value.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        GA4 Previous:
                      </span>
                      <span className="font-semibold text-blue-500 dark:text-blue-300">
                        {category.ga4PrevValue.toLocaleString()}
                      </span>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-600 my-2" />

                    {/* Chatbot */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Chatbot Current:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {chatbot?.currentValue.toLocaleString() ?? "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Chatbot Previous:
                      </span>
                      <span className="font-semibold text-green-500 dark:text-green-300">
                        {chatbot?.previousValue.toLocaleString() ?? "0"}
                      </span>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-600 my-2" />

                    {/* Combined */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        Combined:
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {(
                          category.ga4Value + (chatbot?.currentValue ?? 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Delta:
                      </span>
                      <span className="font-semibold text-gray-500">
                        {(
                          category.ga4Value +
                          (chatbot?.currentValue ?? 0) -
                          (category.ga4PrevValue +
                            (chatbot?.previousValue ?? 0))
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Delta %:
                      </span>
                      <span className="font-semibold text-gray-500">
                        {(() => {
                          const current =
                            category.ga4Value + (chatbot?.currentValue ?? 0);
                          const previous =
                            category.ga4PrevValue +
                            (chatbot?.previousValue ?? 0);
                          const deltaPct =
                            previous > 0
                              ? (
                                  ((current - previous) / previous) *
                                  100
                                ).toFixed(1)
                              : "N/A";
                          return deltaPct !== "N/A" ? `${deltaPct}%` : deltaPct;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedCategory && (
          <>
            {/* Query info para categoría seleccionada */}
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">
                📍 Queries para categoría seleccionada: {selectedCategory}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* GA4 Category Details Query */}
                <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-sm mb-2">
                    🔵 useCategoriaDetails
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Category ID:</strong> {selectedCategory}
                    </p>
                    <p>
                      <strong>Granularity:</strong> {granularity}
                    </p>
                    <p>
                      <strong>Start Date:</strong> {startDateStr}
                    </p>
                    <p>
                      <strong>End Date:</strong> {endDateStr}
                    </p>
                    <p>
                      <strong>Enabled:</strong> {String(!!selectedCategory)}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedCategoryDetails.status}
                    </p>
                    {selectedCategoryDetails.status === "ready" && (
                      <>
                        <p>
                          <strong>Series Points (current):</strong>{" "}
                          {selectedCategoryDetails.series.current.length}
                        </p>
                        <p>
                          <strong>Series Points (previous):</strong>{" "}
                          {selectedCategoryDetails.series.previous.length}
                        </p>
                        <p>
                          <strong>Donut Items:</strong>{" "}
                          {selectedCategoryDetails.donutData.length}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Chatbot Category Drilldown Query */}
                <div className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">
                    🟢 useCategoryTownBreakdownRaw (profundidad exacta 3)
                  </h4>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Category ID:</strong> {selectedCategory}
                    </p>
                    <p>
                      <strong>Granularity:</strong> {granularity}
                    </p>
                    <p>
                      <strong>Start Date:</strong> {startDateStr}
                    </p>
                    <p>
                      <strong>End Date:</strong> {endDateStr}
                    </p>
                    <p>
                      <strong>Pattern API:</strong> root.{selectedCategory}.*
                    </p>
                    <p>
                      <strong>Filtro interno:</strong> Solo profundidad = 3
                      (root.category.town)
                    </p>
                    <p>
                      <strong>Evita:</strong> ❌ Doble conteo de niveles
                      profundos
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedCategoryChatbotBreakdown.isLoading
                        ? "Loading"
                        : selectedCategoryChatbotBreakdown.isError
                        ? "Error"
                        : "Ready"}
                    </p>
                    {selectedCategoryChatbotBreakdown.data && (
                      <>
                        <p>
                          <strong>Towns (tokens raw):</strong>{" "}
                          {selectedCategoryChatbotBreakdown.data.towns.length}
                        </p>
                        <p>
                          <strong>Total Interactions:</strong>{" "}
                          {selectedCategoryChatbotBreakdown.data.towns
                            .reduce((sum: number, t) => sum + t.currentTotal, 0)
                            .toLocaleString()}
                        </p>
                        <p>
                          <strong>Series Points (current):</strong>{" "}
                          {selectedCategoryChatbotBreakdown.data.series?.current
                            .length || 0}
                        </p>
                        <p>
                          <strong>Series Points (previous):</strong>{" "}
                          {selectedCategoryChatbotBreakdown.data.series
                            ?.previous.length || 0}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Series combinadas info */}
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded shadow">
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 text-sm mb-2">
                  🟣 Combined Series & Donuts (calculadas en cliente)
                </h4>
                <div className="text-xs space-y-1">
                  <p>
                    <strong>Current Points:</strong>{" "}
                    {combinedSeries.current.length}
                  </p>
                  <p>
                    <strong>Previous Points:</strong>{" "}
                    {combinedSeries.previous.length}
                  </p>
                  <p>
                    <strong>Chatbot Series Points:</strong>{" "}
                    {chatbotSeries.current.length}
                  </p>
                  {combinedSeries.current.length > 0 && (
                    <>
                      <p>
                        <strong>Date Range:</strong>{" "}
                        {combinedSeries.current[0]?.label} -{" "}
                        {
                          combinedSeries.current[
                            combinedSeries.current.length - 1
                          ]?.label
                        }
                      </p>
                      <p>
                        <strong>Total Combined Value:</strong>{" "}
                        {combinedSeries.current
                          .reduce((sum, p) => sum + p.value, 0)
                          .toLocaleString()}
                      </p>
                    </>
                  )}
                  <hr className="border-gray-300 dark:border-gray-600 my-2" />
                  <p>
                    <strong>GA4 Donut Items:</strong> {ga4DonutData.length}
                  </p>
                  <p>
                    <strong>GA4 Donut Total:</strong>{" "}
                    {ga4DonutData
                      .reduce((sum, d) => sum + d.value, 0)
                      .toLocaleString()}
                  </p>
                  <p>
                    <strong>Chatbot Donut Items:</strong>{" "}
                    {chatbotDonutData.length}
                  </p>
                  <p>
                    <strong>Chatbot Donut Total:</strong>{" "}
                    {chatbotDonutData
                      .reduce((sum, d) => sum + d.value, 0)
                      .toLocaleString()}
                  </p>
                  <p>
                    <strong>Combined Donut Items:</strong>{" "}
                    {combinedDonutData.length}
                  </p>
                  <p>
                    <strong>Lógica:</strong> Suma valores por label normalizado
                    (detecta duplicados)
                  </p>
                  {combinedDonutData.length > 0 && (
                    <p>
                      <strong>Total Combined Donut:</strong>{" "}
                      {combinedDonutData
                        .reduce((sum, d) => sum + d.value, 0)
                        .toLocaleString()}
                    </p>
                  )}
                  <hr className="border-gray-300 dark:border-gray-600 my-2" />
                  <p className="text-yellow-600 dark:text-yellow-400">
                    ⚠️ <strong>Verificar:</strong> Si GA4 Donut Total ≠ GA4 Card
                    Total, el problema está en useCategoriaDetails (donutData
                    incompleto)
                  </p>
                </div>
              </div>
            </div>

            <DebugCategoryDetail
              categoryId={selectedCategory}
              ga4Data={selectedCategoryDetails.data?.data}
              chatbotData={selectedCategoryChatbotBreakdown.data}
              ga4RawQuery={categoryHookResult.rawQuery}
              chatbotRawQuery={selectedCategoryChatbotBreakdown.data}
            />

            {/* Debug: Comparar totales */}
            {selectedCategory && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                  ⚠️ Debug: Discrepancia de Totales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* GA4 */}
                  <div>
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      GA4 (useCategoriaDetails)
                    </h4>
                    {selectedCategoryDetails.status === "ready" && (
                      <>
                        <p>
                          <strong>Total from API (current):</strong>{" "}
                          {selectedCategoryDetails.data?.data?.totals?.current?.toLocaleString() ??
                            "N/A"}
                        </p>
                        <p>
                          <strong>Donut Items Count:</strong>{" "}
                          {ga4DonutData.length}
                        </p>
                        <p>
                          <strong>Donut Sum:</strong>{" "}
                          {ga4DonutData
                            .reduce((s, d) => s + d.value, 0)
                            .toLocaleString()}
                        </p>
                        {(selectedCategoryDetails.data?.data?.totals?.current ??
                          0) ===
                        ga4DonutData.reduce((s, d) => s + d.value, 0) ? (
                          <p className="text-green-600 dark:text-green-400 mt-2">
                            ✅ <strong>Totales coinciden</strong> (incluyendo
                            bucket &quot;Otros&quot;)
                          </p>
                        ) : (
                          <p className="text-red-600 dark:text-red-400 mt-2">
                            <strong>Diferencia:</strong>{" "}
                            {(
                              (selectedCategoryDetails.data?.data?.totals
                                ?.current ?? 0) -
                              ga4DonutData.reduce((s, d) => s + d.value, 0)
                            ).toLocaleString()}
                            {" eventos perdidos"}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Chatbot */}
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      Chatbot (useCategoryTownBreakdownRaw)
                    </h4>
                    {selectedCategoryChatbotBreakdown.data && (
                      <>
                        <p>
                          <strong>Total from API:</strong>{" "}
                          {selectedCategoryChatbotBreakdown.data.towns
                            .reduce((s: number, t) => s + t.currentTotal, 0)
                            .toLocaleString()}
                        </p>
                        <p>
                          <strong>Donut Items Count:</strong>{" "}
                          {chatbotDonutData.length}
                        </p>
                        <p>
                          <strong>Donut Sum:</strong>{" "}
                          {chatbotDonutData
                            .reduce((s, d) => s + d.value, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-green-600 dark:text-green-400 mt-2">
                          <strong>Diferencia:</strong>{" "}
                          {(
                            selectedCategoryChatbotBreakdown.data.towns.reduce(
                              (s: number, t) => s + t.currentTotal,
                              0
                            ) -
                            chatbotDonutData.reduce((s, d) => s + d.value, 0)
                          ).toLocaleString()}
                          {" (debería ser 0)"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <DebugCategoryCharts
                categoryId={selectedCategory}
                granularity={granularity}
                ga4Series={
                  selectedCategoryDetails.status === "ready"
                    ? selectedCategoryDetails.series
                    : { current: [], previous: [] }
                }
                chatbotSeries={chatbotSeries}
                combinedSeries={combinedSeries}
                ga4DonutData={ga4DonutData}
                chatbotDonutData={chatbotDonutData}
                combinedDonutData={combinedDonutData}
                ga4DeltaPct={
                  selectedCategoryDetails.status === "ready"
                    ? selectedCategoryDetails.deltaPct
                    : null
                }
                chatbotDeltaPct={null}
                combinedDeltaPct={null}
              />
            </div>
          </>
        )}

        <div className="mb-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">
            🔍 Hook State Completo:
          </h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <pre className="text-sm overflow-auto max-h-96 bg-gray-100 dark:bg-gray-900 p-4 rounded font-mono">
              {JSON.stringify(categoryHookResult, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal con tabs
function DebugPageInner() {
  const [activeTab, setActiveTab] = useState<TabId>("towns");

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-6">
          <DebugTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Contenido según tab */}
      {activeTab === "towns" ? (
        <TownTimeProvider>
          <DebugTownsTab />
        </TownTimeProvider>
      ) : (
        <TagTimeProvider>
          <DebugCategoriesTab />
        </TagTimeProvider>
      )}
    </div>
  );
}

export default function DebugPage() {
  return <DebugPageInner />;
}
