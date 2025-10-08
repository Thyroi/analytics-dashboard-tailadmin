"use client";

import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useMemo, useState } from "react";

import StickyHeaderSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";

import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { labelToTownId } from "@/lib/utils/sector";

import { useCategoriesTotals } from "@/features/chatbot/hooks/useCategoriesTotals";
import { useCategoryDetailsChatbot } from "@/features/chatbot/hooks/useCategoryDetailsChatbot";

/* ============ sección interna ============ */
function ChatbotByTagSectionInner() {
  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    endISO,
  } = useTagTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // DELTAS (independiente de analytics)
  const {
    state,
    ids,
    itemsById,
    isFetching: isDeltaLoading,
  } = useCategoriesTotals(granularity, endISO);

  const displayedIds = useMemo<string[]>(
    () =>
      state.status === "ready" ? (ids as string[]) : [...CATEGORY_ID_ORDER],
    [state.status, ids]
  );

  // DRILL
  type Drill =
    | { kind: "category"; categoryId: CategoryId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const catId = expandedId as CategoryId | null;

  // Series & donut (independiente de analytics)
  const catForDetails =
    (drill?.kind === "category" ? drill.categoryId : catId) ??
    ("naturaleza" as CategoryId);
  const { data: details } = useCategoryDetailsChatbot(
    catForDetails,
    granularity as Granularity,
    endISO
  );

  const seriesCat = {
    current: (details?.current ?? []) as SeriesPoint[],
    previous: (details?.previous ?? []) as SeriesPoint[],
  };
  const donutCat = (details?.donut ?? []) as DonutDatum[];

  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? itemsById[id as CategoryId]?.deltaPct ?? null
      : null;

  const getSeriesFor = (_id: string) => {
    if (catId && _id === catId) return seriesCat;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    if (catId && _id === catId) return donutCat;
    return [];
  };

  const handleOpen = (id: string) => {
    setExpandedId(id);
    setDrill({ kind: "category", categoryId: id as CategoryId });
  };

  const handleSliceClick = (label: string) => {
    const townId = labelToTownId(label);
    if (townId && expandedId) {
      setDrill({
        kind: "town+cat",
        townId,
        categoryId: expandedId as CategoryId,
      });
    }
  };

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Chatbot · Analíticas por categoría"
        subtitle="Totales, delta y drill por municipio (donut = último bucket)"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <SectorsGridDetailed
        mode="tag"
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

/* ============ export default ============ */
export default function ChatbotByTagSection() {
  return (
    <TagTimeProvider>
      <ChatbotByTagSectionInner />
    </TagTimeProvider>
  );
}
