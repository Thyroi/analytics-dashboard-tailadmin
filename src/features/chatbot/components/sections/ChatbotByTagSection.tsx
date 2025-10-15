"use client";

import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
// import { useMemo, useState } from "react"; // TEMPORALMENTE DESACTIVADO

import StickyHeaderSection from "@/components/common/StickyHeaderSection";

// TEMPORALMENTE DESACTIVADO
// import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
// import type { TownId } from "@/lib/taxonomy/towns";
// import type { DonutDatum, SeriesPoint } from "@/lib/types";
import type { Granularity } from "@/lib/types";

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

  // TEMPORALMENTE DESACTIVADO - TODO: Reactivar cuando se necesite la funcionalidad completa
  // const [expandedId, setExpandedId] = useState<string | null>(null);
  // const { state, ids, itemsById, isFetching: isDeltaLoading } = useCategoriesTotals(granularity, endISO);
  // const displayedIds = useMemo<string[]>(() => state.status === "ready" ? (ids as string[]) : [...CATEGORY_ID_ORDER], [state.status, ids]);
  // const [drill, setDrill] = useState<Drill | null>(null);
  // const catId = expandedId as CategoryId | null;
  // const seriesCat = { current: [] as SeriesPoint[], previous: [] as SeriesPoint[] };
  // const donutCat = [] as DonutDatum[];
  // const getDeltaPctFor = (id: string) => null;
  // const getSeriesFor = (id: string) => ({ current: [], previous: [] });
  // const getDonutFor = (id: string) => [];
  // const handleOpen = (id: string) => {};
  // const handleSliceClick = (label: string) => {};

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
