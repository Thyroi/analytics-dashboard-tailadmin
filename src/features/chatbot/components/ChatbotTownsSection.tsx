"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";

import { useState, useRef } from "react";

import { type TownCardData, useChatbotTowns } from "../hooks/useChatbotTowns";
import TopTownsKPI from "./TopTownsKPI";
import TownCard from "./TownCard";
import TownExpandedCard from "./TownExpandedCard";

function ChatbotTownsSectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
  } = useTagTimeframe();

  // Convertir fechas de manera segura
  let startDateStr: string | null = null;
  let endDateStr: string | null = null;

  try {
    startDateStr =
      startDate instanceof Date && !isNaN(startDate.getTime())
        ? startDate.toISOString().split("T")[0]
        : null;
    endDateStr =
      endDate instanceof Date && !isNaN(endDate.getTime())
        ? endDate.toISOString().split("T")[0]
        : null;
  } catch (error) {
    console.error("Error converting dates:", { startDate, endDate, error });
  }

  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  
  // Ref para hacer scroll al drilldown
  const drilldownRef = useRef<HTMLDivElement>(null);

  // Obtener datos de towns
  const { towns, isLoading, isError, error, refetch } = useChatbotTowns({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
    enabled: true,
  });

  // Función para manejar click en town con scroll automático
  const handleTownClick = (townId: string) => {
    setSelectedTownId(townId);
    
    // Scroll automático al drilldown después de un pequeño delay
    setTimeout(() => {
      drilldownRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      // Forzar reflow de componentes (charts) que dependen del tamaño del contenedor
      // Algunos chart libraries necesitan un evento de resize para recalcular dimensiones.
      // Disparamos dos eventos: resize nativo y un custom 'chart-reflow' para compatibilidad.
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event('resize'));
        } catch {
          // no-op en entornos donde window no existe
        }

        try {
          window.dispatchEvent(new CustomEvent('chart-reflow'));
        } catch {
          // noop
        }
      }, 200);
    }, 100);
  };

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      {/* Sticky Header Section */}
      <StickyHeaderSection
        title="Chatbot · Analíticas por pueblo"
        subtitle="Interacciones del chatbot organizadas por municipio"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      {/* KPI Section - Top Towns */}
      <div className="px-4 mb-6">
        <TopTownsKPI
          towns={towns.slice(0, 8)} // Top 8 towns
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      {/* Drilldown expandido como overlay */}
      {selectedTownId && (
        <div ref={drilldownRef} className="px-4 mb-6">
          <TownExpandedCard
            townId={selectedTownId}
            granularity={granularity}
            startDate={startDateStr}
            endDate={endDateStr}
            onClose={() => setSelectedTownId(null)}
          />
        </div>
      )}

      {/* Grid de towns siempre visible */}
      <div className="px-4">
        <ChatbotTownsGrid
          towns={towns}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefetch={refetch}
          onTownClick={handleTownClick}
          selectedTownId={selectedTownId}
        />
      </div>
    </section>
  );
}

function ChatbotTownsGrid({
  towns,
  isLoading,
  isError,
  error,
  onRefetch,
  onTownClick,
  selectedTownId,
}: {
  towns: TownCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefetch: () => void;
  onTownClick: (townId: string) => void;
  selectedTownId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300 mb-4">
          Error cargando datos de pueblos:{" "}
          {error?.message || "Error desconocido"}
        </p>
        <button
          onClick={() => onRefetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (towns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No hay datos de pueblos disponibles para el período seleccionado
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {towns.map((town) => (
        <TownCard
          key={town.id}
          data={town}
          onClick={() => onTownClick(town.id)}
          isSelected={selectedTownId === town.id}
        />
      ))}
    </div>
  );
}

export default function ChatbotTownsSection() {
  return (
    <TagTimeProvider>
      <ChatbotTownsSectionContent />
    </TagTimeProvider>
  );
}
