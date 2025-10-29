"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useCategoriesTotals } from "@/features/analytics/hooks/categorias";
// TEMPORALMENTE: Usar directamente el hook principal, no el legacy
import { useCategoriaDetails } from "@/features/analytics/hooks/categorias/useCategoriaDetails";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint } from "@/lib/types";
import { labelToTownId } from "@/lib/utils/core/sector";

import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

function AnalyticsByTagSectionInner() {
  const queryClient = useQueryClient();

  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    updatePickerDatesOnly,

    getCurrentPeriod,

    getCalculatedGranularity,
  } = useTagTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener períodos actuales usando contexto
  const currentPeriod = getCurrentPeriod();
  const calculatedGranularity = getCalculatedGranularity();

  // Usar períodos calculados para deltas/KPIs - formato legacy
  const timeParams = {
    startISO: currentPeriod.start,
    endISO: currentPeriod.end,
  };

  const { state, ids, itemsById, isInitialLoading, isFetching } =
    useCategoriesTotals(calculatedGranularity, timeParams);

  const displayedIds = useMemo<string[]>(
    () =>
      state.status === "ready" ? (ids as string[]) : [...CATEGORY_ID_ORDER],
    [state.status, ids]
  );

  type Drill =
    | { kind: "category"; categoryId: CategoryId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);
  const catId = expandedId as CategoryId | null;

  // ✅ Calcular rangos correctos para SERIES según mode y granularity
  const seriesRanges =
    mode === "range"
      ? computeRangesForSeries(
          calculatedGranularity,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
      : computeRangesForSeries(calculatedGranularity);

  // NIVEL 1 - usar granularidad CALCULADA y rangos correctos - USANDO HOOK PRINCIPAL DE ANALYTICS
  const categoryDetailsState = useCategoriaDetails({
    categoryId:
      (drill?.kind === "category" ? drill.categoryId : catId) ??
      ("naturaleza" as CategoryId),
    granularity: calculatedGranularity, // ✅ CORREGIDO: Usar granularidad calculada, no la del UI
    startDate: seriesRanges.current.start, // ✅ startISO calculado por computeRangesForSeries
    endDate: seriesRanges.current.end, // ✅ endISO calculado por computeRangesForSeries
  });

  const seriesCat = categoryDetailsState.series;
  const donutCat = categoryDetailsState.donutData;

  // --- getters ---
  const EMPTY_SERIES = useMemo(
    () => ({ current: [] as SeriesPoint[], previous: [] as SeriesPoint[] }),
    []
  );

  const getDeltaPctFor = useCallback(
    (id: string) =>
      state.status === "ready"
        ? itemsById[id as CategoryId]?.deltaPct ?? null
        : null,
    [state.status, itemsById]
  );

  const getDeltaArtifactFor = useCallback(
    (id: string) => {
      const artifact =
        state.status === "ready"
          ? itemsById[id as CategoryId]?.deltaArtifact ?? null
          : null;

      return artifact;
    },
    [state.status, itemsById]
  );

  const getSeriesFor = useCallback(
    (_id: string) => {
      if (catId && _id === catId) {
        // Verificación defensiva: asegurar que seriesCat tiene la estructura correcta
        return seriesCat &&
          typeof seriesCat === "object" &&
          seriesCat.current &&
          seriesCat.previous
          ? seriesCat
          : EMPTY_SERIES;
      }
      return EMPTY_SERIES;
    },
    [catId, seriesCat, EMPTY_SERIES]
  );

  const getDonutFor = useCallback(
    (_id: string) => {
      if (catId && _id === catId) {
        // Verificación defensiva: asegurar que donutCat es un array
        return Array.isArray(donutCat)
          ? donutCat.map((d) => ({ label: d.label, value: d.value }))
          : [];
      }
      return [];
    },
    [catId, donutCat]
  );

  // --- handlers ---
  const handleOpen = useCallback((id: string) => {
    setExpandedId(id);
    setDrill({ kind: "category", categoryId: id as CategoryId });
  }, []);

  const handleSliceClick = useCallback(
    (label: string) => {
      const townId = labelToTownId(label);

      if (townId && expandedId) {
        const newDrill = {
          kind: "town+cat" as const,
          townId,
          categoryId: expandedId as CategoryId,
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
    if (!drill || drill.kind !== "town+cat") return undefined;

    // ✅ SIEMPRE usar las fechas del contexto (ya calculadas correctamente)
    // No recalcular desde computeRangesForKPI porque perdemos la fecha correcta
    const result = {
      townId: drill.townId,
      categoryId: drill.categoryId,
      granularity: calculatedGranularity,
      startISO: currentPeriod.start,
      endISO: currentPeriod.end,
    };

    return result;
  }, [drill, calculatedGranularity, currentPeriod]);

  // Remonta el grid si cambian exp/drill/granularidad/período
  const gridKey = useMemo(() => {
    const base = `g=${calculatedGranularity}|end=${currentPeriod.end}|exp=${
      expandedId ?? ""
    }`;
    if (drill?.kind === "town+cat")
      return `${base}|town=${drill.townId}|cat=${drill.categoryId}`;
    if (drill?.kind === "category") return `${base}|cat=${drill.categoryId}`;
    return base;
  }, [calculatedGranularity, currentPeriod.end, expandedId, drill]);

  return (
    <section className="max-w-[1560px]">
      <StickyHeaderSection
        title="Analíticas por categoría"
        subtitle="Vista general del rendimiento y métrricas"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
        onPickerDatesUpdate={updatePickerDatesOnly}
      />

      <SectorsGrid
        key={gridKey}
        variant="detailed"
        mode="tag"
        ids={displayedIds}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={getDeltaPctFor}
        getDeltaArtifactFor={getDeltaArtifactFor}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={handleClose}
        onSliceClick={handleSliceClick}
        isDeltaLoading={isInitialLoading || isFetching}
        // NIVEL 2 (drill) - usar período calculado
        level2Data={level2Data}
        startDate={startDate}
        endDate={endDate}
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
