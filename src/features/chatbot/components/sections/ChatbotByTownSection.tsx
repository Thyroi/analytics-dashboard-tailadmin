"use client";

import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import StickyHeaderSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetailsChatbot } from "@/features/chatbot/hooks/useTownDetailsChatbot";
import { useTownsTotalsChatbot } from "@/features/chatbot/hooks/useTownsTotalsChatbot";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { labelToCategoryId } from "@/lib/utils/sector";
import { useMemo, useState } from "react";

function ChatbotByTownSectionInner() {
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

  // DELTAS (independiente de analytics)
  const {
    state,
    ids,
    itemsById,
    isFetching: isDeltaLoading,
  } = useTownsTotalsChatbot(granularity, endISO);

  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  // DRILL
  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // Series & donut (independiente de analytics)
  const townForDetails =
    (drill?.kind === "town" ? drill.townId : townId) ??
    (TOWN_ID_ORDER[0] as TownId);
  const { data: details } = useTownDetailsChatbot(
    townForDetails,
    granularity as Granularity,
    endISO
  );

  const seriesTown = {
    current: (details?.current ?? []) as SeriesPoint[],
    previous: (details?.previous ?? []) as SeriesPoint[],
  };
  const donutTown = (details?.donut ?? []) as DonutDatum[];

  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? itemsById[id as TownId]?.deltaPct ?? null : null;

  const getSeriesFor = (_id: string) => {
    if (townId && _id === townId) return seriesTown;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
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
      setDrill({
        kind: "town+cat",
        townId: expandedId as TownId,
        categoryId: categoryId as CategoryId,
      });
    }
  };

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Chatbot · Analíticas por municipio"
        subtitle="Totales, delta y drill por categoría (donut = último bucket)"
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
        granularity={granularity as Granularity}
        onGranularityChange={setGranularity as (g: Granularity) => void}
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
        isDeltaLoading={isDeltaLoading}
        // Nivel 2 (drill)
        forceDrillTownId={drill?.kind === "town+cat" ? drill.townId : undefined}
        fixedCategoryId={
          drill?.kind === "town+cat" ? drill.categoryId : undefined
        }
        endISO={endISO}
        startDate={startDate}
        endDate={endDate}
      />
    </section>
  );
}

export default function ChatbotByTownSection() {
  return (
    <TownTimeProvider>
      <ChatbotByTownSectionInner />
    </TownTimeProvider>
  );
}
