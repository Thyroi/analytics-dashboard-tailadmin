"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import {
  usePueblosTotals,
  useTownDetails,
} from "@/features/analytics/hooks/pueblos";
import { type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";
import type { SeriesPoint } from "@/lib/types";
import { labelToCategoryId } from "@/lib/utils/core/sector";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

function AnalyticsByTownSectionInner() {
  const queryClient = useQueryClient();

  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    getCurrentPeriod,
    getCalculatedGranularity,
  } = useTownTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener períodos usando nueva lógica
  const currentPeriod = getCurrentPeriod();
  const calculatedGranularity = getCalculatedGranularity();

  // Usar períodos calculados para deltas/KPIs - formato legacy
  const timeParams = {
    startISO: currentPeriod.start,
    endISO: currentPeriod.end,
  };

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    usePueblosTotals(calculatedGranularity, timeParams);

  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const townId = expandedId as TownId | null;

  // NIVEL 1 - usar granularidad CALCULADA (respeta selección del usuario)
  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    calculatedGranularity // ✅ Usar granularidad calculada (que ahora respeta la selección del usuario)
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
        const newDrill = {
          kind: "town+cat" as const,
          townId: expandedId as TownId,
          categoryId,
        };

        // Invalidar queries anteriores antes de actualizar el drill
        if (drill?.kind === "town+cat") {
          queryClient.invalidateQueries({
            queryKey: ["drilldown-details"],
          });
        }

        setDrill(newDrill);
      }
    },
    [expandedId, drill, queryClient]
  );

  const handleClose = useCallback(() => {
    setExpandedId(null);
    setDrill(null);
  }, []);

  // Memoizar level2Data para mejor tracking de dependencias
  const level2Data = useMemo(() => {
    return drill?.kind === "town+cat"
      ? {
          townId: drill.townId,
          categoryId: drill.categoryId,
          granularity: calculatedGranularity, // ✅ Usar granularidad calculada para nivel 2
          endISO: currentPeriod.end,
        }
      : undefined;
  }, [drill, calculatedGranularity, currentPeriod.end]);

  // Remonta el grid si cambian exp/drill/granularidad/período
  const gridKey = useMemo(() => {
    const base = `g=${calculatedGranularity}|end=${currentPeriod.end}|exp=${
      expandedId ?? ""
    }`;
    if (drill?.kind === "town+cat")
      return `${base}|town=${drill.townId}|cat=${drill.categoryId}`;
    if (drill?.kind === "town") return `${base}|town=${drill.townId}`;
    return base;
  }, [calculatedGranularity, currentPeriod.end, expandedId, drill]);

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

      <SectorsGrid
        key={gridKey}
        variant="detailed"
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
        // Nivel 2 (drill) - usar fecha corregida
        level2Data={level2Data}
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
