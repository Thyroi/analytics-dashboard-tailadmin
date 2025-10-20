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
import { useChatbotCategories } from "@/features/chatbot/hooks/useChatbotCategories";
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

  // TOP CATEGORIES KPI usando el nuevo hook integrado
  // Convertir fechas de manera segura
  const startISO =
    startDate instanceof Date && !isNaN(startDate.getTime())
      ? startDate.toISOString().split("T")[0]
      : null;
  const endISO_safe =
    endDate instanceof Date && !isNaN(endDate.getTime())
      ? endDate.toISOString().split("T")[0]
      : endISO; // Fallback al endISO del contexto

  const { categories: topCategories, isLoading: isTopLoading } =
    useChatbotCategories({
      granularity: granularity as Granularity,
      startDate: startISO,
      endDate: endISO_safe,
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
          <TopCategoriesKPI
            categories={topCategories.slice(0, 4)}
            isLoading={isTopLoading}
            isError={false}
          />
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
