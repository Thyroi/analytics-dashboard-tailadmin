"use client";

import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useMemo, useState } from "react";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";

import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

// import { useCategoriesTotals } from "@/features/chatbot/hooks/useCategoriesTotals"; // TEMPORALMENTE DESACTIVADO
// import { useCategoryDetailsChatbot } from "@/features/chatbot/hooks/useCategoryDetailsChatbot"; // TEMPORALMENTE DESACTIVADO
import { useTopCategories } from "@/features/chatbot/hooks/useTopCategories";
import TopCategoriesKPI from "../TopCategoriesKPI";

/* ============ sección interna ============ */
function ChatbotByTagSectionInner() {
  // ...existing code...
  // ...existing context and state code...

  // TOP CATEGORIES KPI (declaración después de obtener granularity y endISO)

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

  // TOP CATEGORIES KPI (declaración justo después de obtener granularidad y rango)
  // Usamos un patrón amplio para obtener TODAS las categorías y sus variantes
  const topPatterns = ["root.*"];
  const startISO = startDate.toISOString().split("T")[0];
  const { data: topCategories, isLoading: isTopLoading } = useTopCategories({
    patterns: topPatterns,
    granularity: granularity as Granularity,
    startTime: startISO,
    endTime: endISO,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // DELTAS (independiente de analytics) - TEMPORALMENTE DESACTIVADO
  // const {
  //   state,
  //   ids,
  //   itemsById,
  //   isFetching: isDeltaLoading,
  // } = useCategoriesTotals(granularity, endISO);

  // Mock data para evitar errores
  const state = { status: "ready" as const };
  const ids = CATEGORY_ID_ORDER;
  const itemsById = {};
  const isDeltaLoading = false;

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

  // Series & donut (independiente de analytics) - TEMPORALMENTE DESACTIVADO
  // const catForDetails =
  //   (drill?.kind === "category" ? drill.categoryId : catId) ??
  //   ("naturaleza" as CategoryId);
  // const { data: details } = useCategoryDetailsChatbot(
  //   catForDetails,
  //   granularity as Granularity,
  //   endISO
  // );

  const seriesCat = {
    current: [] as SeriesPoint[], // (details?.current ?? []) as SeriesPoint[],
    previous: [] as SeriesPoint[], // (details?.previous ?? []) as SeriesPoint[],
  };
  const donutCat = [] as DonutDatum[]; // (details?.donut ?? []) as DonutDatum[];

  const getDeltaPctFor = (_id: string) => null; // itemsById[id as CategoryId]?.deltaPct ?? null

  const getSeriesFor = (_id: string) => {
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    return [];
  };

  const handleOpen = (_id: string) => {
    // Temporalmente desactivado
  };

  const handleSliceClick = (_label: string) => {
    // Temporalmente desactivado
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
      <div>
        {isTopLoading ? (
          <div className="mb-6">Cargando KPIs...</div>
        ) : topCategories && topCategories.length > 0 ? (
          <TopCategoriesKPI items={topCategories} />
        ) : null}
      </div>
      {/* TEMPORALMENTE DESACTIVADO - SectorsGridDetailed
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
      */}
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
