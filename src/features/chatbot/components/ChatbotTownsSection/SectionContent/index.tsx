"use client";

import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import { toISO } from "@/lib/utils/time/datetime";
import {
  useChatbotTownHandlers,
  useChatbotTownTotals,
} from "../../../hooks/useChatbotTownTotals";
import { useTownDrilldown } from "../useTownDrilldown";
import { DrilldownSection } from "./DrilldownSection";
import { SectionHeader } from "./SectionHeader";
import { TopTownsSection } from "./TopTownsSection";
import { TownsGridSection } from "./TownsGridSection";

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
      <SectionHeader
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

      <TopTownsSection towns={towns} isLoading={isLoading} isError={isError} />

      <DrilldownSection
        selectedTownId={selectedTownId}
        drilldownRef={drilldownRef}
        effectiveGranularity={effectiveGranularity}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        onClose={handleClose}
        onSelectCategory={handleSelectCategory}
        onScrollToLevel1={handleScrollToLevel1}
      />

      <TownsGridSection
        towns={towns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRefetch={refetch}
        onTownClick={handleTownClick}
        selectedTownId={selectedTownId}
      />
    </section>
  );
}
