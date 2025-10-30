"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import { useCategoriesTotals } from "@/features/analytics/hooks/categorias";
import { useCategoriaDetails } from "@/features/analytics/hooks/categorias/useCategoriaDetails";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCategoryDataHandlers } from "./useCategoryDataHandlers";
import { useCategoryDrill } from "./useCategoryDrill";
import { useSeriesRanges } from "./useSeriesRanges";

export function SectionContent() {
  const queryClient = useQueryClient();

  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    updatePickerDatesOnly,
    getCurrentPeriod,
    getCalculatedGranularity,
  } = useTagTimeframe();

  // Obtener períodos actuales usando contexto
  const currentPeriod = getCurrentPeriod();
  const calculatedGranularity = getCalculatedGranularity();

  // Usar períodos calculados para deltas/KPIs - formato legacy
  const timeParams = {
    startISO: currentPeriod.start,
    endISO: currentPeriod.end,
  };

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useCategoriesTotals(calculatedGranularity, timeParams);

  // Filtrar "otros" de las categorías mostradas
  const displayedIds = useMemo<string[]>(
    () =>
      state.status === "ready"
        ? (ids as string[]).filter((id) => id !== "otros")
        : CATEGORY_ID_ORDER.filter((id) => id !== "otros"),
    [state.status, ids]
  );

  // Hook drill state management
  const {
    catId,
    drill,
    level2Data,
    gridKey,
    expandedId,
    handleOpen,
    handleSliceClick,
    handleClose,
  } = useCategoryDrill(calculatedGranularity, currentPeriod, queryClient);

  // Calcular rangos correctos para SERIES según mode y granularity
  const seriesRanges = useSeriesRanges(
    mode,
    calculatedGranularity,
    startDate,
    endDate
  );

  // NIVEL 1 - usar granularidad CALCULADA y rangos correctos
  const categoryDetailsState = useCategoriaDetails({
    categoryId:
      (drill?.kind === "category" ? drill.categoryId : catId) ??
      ("naturaleza" as CategoryId),
    granularity: calculatedGranularity,
    startDate: seriesRanges.current.start,
    endDate: seriesRanges.current.end,
  });

  const seriesCat = categoryDetailsState.series;
  const donutCat = categoryDetailsState.donutData;

  // Data handlers
  const { getDeltaPctFor, getDeltaArtifactFor, getSeriesFor, getDonutFor } =
    useCategoryDataHandlers(state, itemsById, catId, seriesCat, donutCat);

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Analíticas por categoría"
        subtitle="Vista general del rendimiento y métrricas"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
        onPickerDatesUpdate={updatePickerDatesOnly}
      />

      <SectorsGrid
        key={gridKey}
        variant="detailed"
        mode="tag"
        ids={displayedIds}
        granularity={calculatedGranularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={getDeltaPctFor}
        getDeltaArtifactFor={getDeltaArtifactFor}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={handleClose}
        onSliceClick={handleSliceClick}
        isDeltaLoading={isInitialLoading || isFetching}
        level2Data={level2Data}
        startDate={startDate}
        endDate={endDate}
      />
    </section>
  );
}
