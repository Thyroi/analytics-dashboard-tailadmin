"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { type CategoryId } from "@/lib/taxonomy/categories";

import { toISO } from "@/lib/utils/time/datetime";
import { useRef, useState } from "react";

import {
  useChatbotTownHandlers,
  useChatbotTownTotals,
  type TownCardData,
} from "../hooks/useChatbotTownTotals";
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
    getCalculatedGranularity,
  } = useTagTimeframe();

  // Obtener handlers para invalidación/refetch
  const handlers = useChatbotTownHandlers();

  // Usar las fechas del contexto (ya normalizadas a medianoche UTC en el Provider)
  const startDateStr: string | null = startDate ? toISO(startDate) : null;
  const endDateStr: string | null = endDate ? toISO(endDate) : null;

  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  // Ref para hacer scroll al drilldown
  const drilldownRef = useRef<HTMLDivElement>(null);

  // Hook principal con React Query (sin useEffect)
  const effectiveGranularity = getCalculatedGranularity();

  const { towns, isLoading, isError, error, refetch } = useChatbotTownTotals({
    granularity: effectiveGranularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  // Función para manejar click en town con scroll automático
  const handleTownClick = (townId: string) => {
    setSelectedTownId(townId);

    // Scroll automático usando requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      drilldownRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      // Disparar eventos de resize de forma asíncrona después del scroll
      requestAnimationFrame(() => {
        try {
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new CustomEvent("chart-reflow"));
        } catch {
          // no-op en entornos donde window no existe
        }
      });
    });
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
        onGranularityChange={(newGranularity) => {
          setSelectedTownId(null); // Cerrar drilldown al cambiar granularidad
          setSelectedCategoryId(null);
          setGranularity(newGranularity);
          handlers.onGranularityChange();
        }}
        onRangeChange={(start, end) => {
          setRange(start, end);
          handlers.onRangeChange();
        }}
        onClearRange={() => {
          clearRange();
          handlers.onClearRange();
        }}
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
            key={selectedTownId} // Forzar remontaje cuando cambia el pueblo
            townId={selectedTownId}
            granularity={effectiveGranularity}
            startDate={startDateStr}
            endDate={endDateStr}
            onClose={() => {
              setSelectedTownId(null);
              setSelectedCategoryId(null);
            }}
            onSelectCategory={(categoryId: CategoryId) => {
              setSelectedCategoryId(categoryId);
              // TownExpandedCard ya maneja la navegación Nivel 1→2 internamente
            }}
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
