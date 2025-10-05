// src/features/analytics/sectors/AnalyticsByTownSection/index.tsx
"use client";

import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";

import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";

import { useTownsTotals } from "@/features/home/hooks/useTownsTotals"; // totales por pueblo
import { useTownDetails } from "@/features/home/hooks/useTownDetails"; // series + donut por pueblo
import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown"; // drilldown pueblo+categoría

import { CATEGORY_ID_ORDER, CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";

import { useState } from "react";
import StickyHeaderSection from "../sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";

const LABEL_TO_CAT: Record<string, CategoryId> = Object.fromEntries(
  CATEGORY_ID_ORDER.map((id) => [CATEGORY_META[id].label, id])
) as Record<string, CategoryId>;

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

  // Totales por municipio (ahora preserva deltaPct: number | null)
  const { state, ids, itemsById } = useTownsTotals(granularity, endISO);

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // Serie + donut del pueblo seleccionado (primer nivel)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity
  );

  // Drilldown pueblo + categoría (segundo nivel)
  const townCat = drill?.kind === "town+cat" ? drill : null;
  const { series: ddSeries, donut: ddDonut } = useTownCategoryDrilldown(
    townCat
      ? { townId: townCat.townId, categoryId: townCat.categoryId, granularity }
      : null
  );

  // Mantener null si no hay base de comparación (no redondear ni forzar a 0 aquí)
  const getDeltaPctFor = (id: string) => {
    if (state.status !== "ready") return null;
    const v = itemsById[id as TownId]?.deltaPct ?? null;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };

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
