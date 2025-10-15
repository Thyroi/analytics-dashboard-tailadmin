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
import { getCorrectDatesForGranularity } from "@/lib/utils/time/deltaDateCalculation";
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
    endISO,
  } = useTownTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calcular fechas correctas según granularidad
  const { currentEndISO } = getCorrectDatesForGranularity(endDate, granularity, mode);

  // Usar fechas corregidas para deltas/KPIs
  const timeParams =
    mode === "range"
      ? {
          startISO: startDate.toISOString().split("T")[0],
          endISO: endDate.toISOString().split("T")[0],
        }
      : { endISO: currentEndISO };

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    usePueblosTotals(granularity, timeParams);

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
    mode === "range" ? endDate.toISOString().split("T")[0] : currentEndISO, // endISO corregido
    mode === "range" ? startDate.toISOString().split("T")[0] : undefined // startISO
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
        level2Data={
          drill?.kind === "town+cat"
            ? {
                townId: drill.townId,
                categoryId: drill.categoryId,
                granularity,
                endISO: mode === "range" ? endISO : currentEndISO,
              }
            : undefined
        }
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
