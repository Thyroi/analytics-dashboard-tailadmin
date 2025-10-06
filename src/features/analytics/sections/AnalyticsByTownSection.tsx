"use client";

import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import { useTownsTotals } from "@/features/home/hooks/useTownsTotals";
import { type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";
import { labelToCategoryId } from "@/lib/utils/sector";
import { useMemo, useState } from "react";
import StickyHeaderSection from "../sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";

function AnalyticsByTownSectionInner() {
  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    endISO,
  } = useTownTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useTownsTotals(granularity, endISO);

  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // ⬇️ ahora pasa endISO; si el drill es "town" fijamos ese id
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity,
    endISO
  );

  // 2º nivel (town+cat) con endISO
  const { series: ddSeries, donut: ddDonut } = useTownCategoryDrilldown(
    drill?.kind === "town+cat"
      ? {
          townId: drill.townId,
          categoryId: drill.categoryId,
          granularity,
          endISO,
        }
      : null
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? itemsById[id as TownId]?.deltaPct ?? null : null;

  const getSeriesFor = (_id: string) => {
    if (drill?.kind === "town+cat") return ddSeries;
    if (townId && _id === townId) return seriesTown;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    if (drill?.kind === "town+cat") return ddDonut;
    if (townId && _id === townId) return donutTown;
    return [];
  };

  const handleOpen = (id: string) => {
    setExpandedId(id);
    setDrill({ kind: "town", townId: id as TownId });
  };

  const handleSliceClick = (label: string) => {
    const categoryId = labelToCategoryId(label);
    if (categoryId && expandedId) {
      setDrill({ kind: "town+cat", townId: expandedId as TownId, categoryId });
    }
  };

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Analíticas por municipio"
        subtitle="Vista general del rendimiento y métricas"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <SectorsGridDetailed
        mode="town"
        ids={displayedIds}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={getDeltaPctFor}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={() => {
          setExpandedId(null);
          setDrill(null);
        }}
        onSliceClick={handleSliceClick}
        isDeltaLoading={isInitialLoading || isFetching}
      />
    </section>
  );
}

export default function AnalyticsByTownSection() {
  return (
    <TownTimeProvider>
      <AnalyticsByTownSectionInner />
    </TownTimeProvider>
  );
}
