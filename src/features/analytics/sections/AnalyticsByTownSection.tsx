// src/features/analytics/sections/AnalyticsByTownSection.tsx
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

  // Flags de carga claros (primera carga + revalidaciones)
  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useTownsTotals(granularity, endISO);

  // IDs persistentes para no colapsar la grilla durante las cargas
  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // Detalle del 1er nivel (pueblo)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity
  );

  // Drilldown 2do nivel (pueblo + categoría)
  const townCat = drill?.kind === "town+cat" ? drill : null;
  const { series: ddSeries, donut: ddDonut } = useTownCategoryDrilldown(
    townCat
      ? { townId: townCat.townId, categoryId: townCat.categoryId, granularity }
      : null
  );

  // Mantener null cuando no hay base de comparación
  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? itemsById[id as TownId]?.deltaPct ?? null : null;

  const getSeriesFor = (_id: string) => {
    if (townCat) return ddSeries;
    if (townId && _id === townId) return seriesTown;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    if (townCat) return ddDonut;
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
        // Loader en el aro (delta oculto) en primera carga y revalidación
        isDeltaLoading={isInitialLoading || isFetching}
        forceDrillTownId={townCat ? townCat.townId : undefined}
        fixedCategoryId={townCat ? townCat.categoryId : undefined}
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
