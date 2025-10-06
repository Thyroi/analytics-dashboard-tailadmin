// src/features/analytics/sections/AnalyticsByTownSection.tsx
"use client";

import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import { useTownsTotals } from "@/features/home/hooks/useTownsTotals";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import { labelToCategoryId } from "@/lib/utils/sector";
import type { CategoryId } from "@/lib/taxonomy/categories";
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

  // Totales de los pueblos (para los aros de la grilla)
  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useTownsTotals(granularity, endISO);

  // Mientras carga, mantenemos el orden de taxonomía (placeholders)
  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  // --- DRILL STATE ---
  // kind "town" -> solo overview del municipio (nivel 1)
  // kind "town+cat" -> mostrar nivel 2 dentro del expandido
  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // Datos del NIVEL 1 (overview del municipio seleccionado)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity
  );

  // IMPORTANTÍSIMO:
  // El nivel 2 se carga DENTRO de <SectorExpandedCardDetailed /> usando
  // forceDrillTownId + fixedCategoryId. NO cambiamos las series del nivel 1.
  const forceDrillTownId =
    drill?.kind === "town+cat" ? (drill.townId as TownId) : undefined;
  const fixedCategoryId =
    drill?.kind === "town+cat" ? (drill.categoryId as CategoryId) : undefined;

  // Helpers para SectorsGridDetailed (solo nivel 1)
  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? itemsById[id as TownId]?.deltaPct ?? null : null;

  const getSeriesFor = (_id: string) =>
    townId && _id === townId ? seriesTown : { current: [], previous: [] };

  const getDonutFor = (_id: string) =>
    townId && _id === townId ? donutTown : [];

  // Abrir/cerrar
  const handleOpen = (id: string) => {
    setExpandedId(id);
    setDrill({ kind: "town", townId: id as TownId });
  };

  const handleClose = () => {
    setExpandedId(null);
    setDrill(null);
  };

  // Click en una porción del donut del NIVEL 1 => habilita NIVEL 2
  const handleSliceClick = (label: string) => {
    const categoryId = labelToCategoryId(label);
    if (categoryId && expandedId) {
      setDrill({
        kind: "town+cat",
        townId: expandedId as TownId,
        categoryId,
      });
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
        onClose={handleClose}
        onSliceClick={handleSliceClick}
        isDeltaLoading={isInitialLoading || isFetching}
        forceDrillTownId={forceDrillTownId}
        fixedCategoryId={fixedCategoryId}
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
