"use client";

import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import { useTownsTotals } from "@/features/home/hooks/useTownsTotals";
import { type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";
import type { SeriesPoint } from "@/lib/types";
import { labelToCategoryId } from "@/lib/utils/sector";
import { useCallback, useMemo, useState } from "react";
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

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useTownsTotals(granularity, endISO);

  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // ⚠️ DONA SUPERIOR: SIEMPRE categorías del pueblo (NO pasar categoryId)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity,
    endISO
  );

  // --- getters ---
  const EMPTY_SERIES = useMemo(
    () => ({ current: [] as SeriesPoint[], previous: [] as SeriesPoint[] }),
    []
  );

  const getDeltaPctFor = useCallback(
    (id: string) =>
      state.status === "ready"
        ? itemsById[id as TownId]?.deltaPct ?? null
        : null,
    [state.status, itemsById]
  );

  const getSeriesFor = useCallback(
    (_id: string) => {
      if (townId && _id === townId) return seriesTown;
      return EMPTY_SERIES;
    },
    [townId, seriesTown, EMPTY_SERIES]
  );

  const getDonutFor = useCallback(
    (_id: string) => {
      if (townId && _id === townId) {
        // devolver nueva ref para evitar memos internos obsoletos
        return donutTown.map((d) => ({ label: d.label, value: d.value }));
      }
      return [];
    },
    [townId, donutTown]
  );

  // --- handlers ---
  const handleOpen = useCallback((id: string) => {
    setExpandedId(id);
    setDrill({ kind: "town", townId: id as TownId });
  }, []);

  const handleSliceClick = useCallback(
    (label: string) => {
      // En nivel 1 (pueblo) las etiquetas son CATEGORÍAS
      const categoryId = labelToCategoryId(label);
      if (categoryId && expandedId) {
        setDrill({
          kind: "town+cat",
          townId: expandedId as TownId,
          categoryId,
        });
      }
    },
    [expandedId]
  );

  const handleClose = useCallback(() => {
    setExpandedId(null);
    setDrill(null);
  }, []);

  // Remonta el grid si cambian exp/drill/granularidad/rango
  const gridKey = useMemo(() => {
    const base = `g=${granularity}|end=${endISO ?? ""}|exp=${expandedId ?? ""}`;
    if (drill?.kind === "town+cat")
      return `${base}|town=${drill.townId}|cat=${drill.categoryId}`;
    if (drill?.kind === "town") return `${base}|town=${drill.townId}`;
    return base;
  }, [granularity, endISO, expandedId, drill]);

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Analíticas por municipio"
        subtitle="Vista general del rendimiento y métrricas"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <SectorsGridDetailed
        key={gridKey}
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
        // Nivel 2 (drill) — el panel interno calcula su propia data
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

export default function AnalyticsByTownSection() {
  return (
    <TownTimeProvider>
      <AnalyticsByTownSectionInner />
    </TownTimeProvider>
  );
}
