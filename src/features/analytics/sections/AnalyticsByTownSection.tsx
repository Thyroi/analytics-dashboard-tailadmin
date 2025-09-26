"use client";

import Header from "@/components/common/Header";
import RangeControls from "@/components/dashboard/RangeControls";
import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown"; // 2º nivel
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetails } from "@/features/home/hooks/useTownDetails"; // 1er nivel
import { useTownsTotals } from "@/features/home/hooks/useTownsTotals"; // reusamos
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import StickyHeaderSection from "../sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";

const LABEL_TO_CAT: Record<string, CategoryId> = Object.fromEntries(
  CATEGORY_ID_ORDER.map((id) => [CATEGORY_META[id].label, id])
) as Record<string, CategoryId>;

function AnalyticsByTownSectionInner() {
  // ← Consumimos el contexto (paridad con TagSection)
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

  // Totales por municipio — ahora recibe granularity + endISO (igual que Tag)
  const { state, ids, itemsById } = useTownsTotals(granularity, endISO);

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);

  const townId = expandedId as TownId | null;

  // Detalle de municipio (mantenemos sin rango explícito por paridad con TagSection)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity
  );

  // Drilldown municipio + categoría
  const townCat = drill?.kind === "town+cat" ? drill : null;
  const { series: ddSeries, donut: ddDonut } = useTownCategoryDrilldown(
    townCat
      ? { townId: townCat.townId, categoryId: townCat.categoryId, granularity }
      : null
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? Math.round(itemsById[id as TownId]?.deltaPct ?? 0)
      : 0;

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
    const categoryId = LABEL_TO_CAT[label];
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
        ids={ids as string[]}
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
