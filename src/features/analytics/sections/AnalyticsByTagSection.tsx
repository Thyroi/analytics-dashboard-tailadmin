"use client";

import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useCategoriesTotals } from "@/features/home/hooks/useCategoriesTotals";
import { useCategoryDetails } from "@/features/home/hooks/useCategoryDetails";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER, TOWN_META } from "@/lib/taxonomy/towns";
import { useState } from "react";
import StickyHeaderSection from "../sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";

const LABEL_TO_TOWN: Record<string, TownId> = Object.fromEntries(
  TOWN_ID_ORDER.map((id) => [TOWN_META[id].label, id])
) as Record<string, TownId>;

function AnalyticsByTagSectionInner() {
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
  const { state, ids, itemsById } = useCategoriesTotals(granularity, endISO);

  type Drill =
    | { kind: "category"; categoryId: CategoryId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const catId = expandedId as CategoryId | null;

  // Detalle de la categoría del card superior
  const { series: seriesCat, donutData: donutCat } = useCategoryDetails(
    (drill?.kind === "category" ? drill.categoryId : catId) ??
      ("naturaleza" as CategoryId),
    granularity
  );

  const getDeltaPctFor = (id: string) => {
    // valor "antes" (tal cual viene del estado)
    const raw =
      state.status === "ready"
        ? itemsById[id as CategoryId]?.deltaPct ?? null
        : null;
    const result = typeof raw === "number" && Number.isFinite(raw) ? raw : null;

    return result;
  };

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
    const townId = LABEL_TO_TOWN[label];
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
        title="Anlíticas por categoría"
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
        mode="tag"
        ids={ids}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={(id) => getDeltaPctFor(id)}
        getSeriesFor={(id) => getSeriesFor(id)}
        getDonutFor={(id) => getDonutFor(id)}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={() => {
          setExpandedId(null);
          setDrill(null);
        }}
        onSliceClick={handleSliceClick}
        forceDrillTownId={drill?.kind === "town+cat" ? drill.townId : undefined}
        fixedCategoryId={
          drill?.kind === "town+cat" ? drill.categoryId : undefined
        }
      />
    </section>
  );
}

export default function AnalyticsByTagSection() {
  return (
    <TagTimeProvider>
      <AnalyticsByTagSectionInner />
    </TagTimeProvider>
  );
}
