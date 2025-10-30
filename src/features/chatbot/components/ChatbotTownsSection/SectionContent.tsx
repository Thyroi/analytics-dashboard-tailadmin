"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import { toISO } from "@/lib/utils/time/datetime";
import {
  useChatbotTownHandlers,
  useChatbotTownTotals,
} from "../../hooks/useChatbotTownTotals";
import TopTownsKPI from "../TopTownsKPI";
import TownExpandedCard from "../TownExpandedCard";
import { TownGrid } from "./TownGrid";
import { useTownDrilldown } from "./useTownDrilldown";

export function SectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    updatePickerDatesOnly,
    getCalculatedGranularity,
  } = useTagTimeframe();

  // Obtener handlers para invalidación/refetch
  const handlers = useChatbotTownHandlers();

  // Usar las fechas del contexto (ya normalizadas a medianoche UTC en el Provider)
  const startDateStr: string | null = startDate ? toISO(startDate) : null;
  const endDateStr: string | null = endDate ? toISO(endDate) : null;

  // Hook drilldown state management
  const {
    selectedTownId,
    drilldownRef,
    handleTownClick,
    handleClose,
    handleSelectCategory,
    handleScrollToLevel1,
  } = useTownDrilldown();

  // Hook principal con React Query (sin useEffect)
  const effectiveGranularity = getCalculatedGranularity();

  const { towns, isLoading, isError, error, refetch } = useChatbotTownTotals({
    granularity: effectiveGranularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      {/* Sticky Header Section */}
      <StickyHeaderSection
        title="Chatbot · Analíticas por municipio"
        subtitle="Interacciones del chatbot organizadas por municipio"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={(newGranularity) => {
          // NO cerrar drilldown - solo actualizar granularidad
          // El drilldown se refetcheará automáticamente con React Query
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
        onPickerDatesUpdate={updatePickerDatesOnly}
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
            onClose={handleClose}
            onSelectCategory={handleSelectCategory}
            onScrollToLevel1={handleScrollToLevel1}
          />
        </div>
      )}

      {/* Grid de towns siempre visible */}
      <div className="px-4">
        <TownGrid
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
