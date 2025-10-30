"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import {
  usePueblosTotals,
  useTownDetails,
} from "@/features/analytics/hooks/pueblos";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTownDataHandlers } from "./useTownDataHandlers";
import { useTownDrill } from "./useTownDrill";

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
  } = useTownTimeframe();

  const currentPeriod = getCurrentPeriod();
  const calculatedGranularity = getCalculatedGranularity();

  const timeParams = {
    startISO: currentPeriod.start,
    endISO: currentPeriod.end,
  };

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    usePueblosTotals(calculatedGranularity, timeParams);

  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  const {
    townId,
    drill,
    level2Data,
    gridKey,
    expandedId,
    handleOpen,
    handleSliceClick,
    handleClose,
  } = useTownDrill(calculatedGranularity, currentPeriod, queryClient);

  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    calculatedGranularity
  );

  const { getDeltaPctFor, getDeltaArtifactFor, getSeriesFor, getDonutFor } =
    useTownDataHandlers(state, itemsById, townId, seriesTown, donutTown);

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Analíticas por municipio"
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
        mode="town"
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
