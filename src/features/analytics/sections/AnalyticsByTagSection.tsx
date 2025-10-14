"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import {
  useCategoriesTotals,
  useCategoryDetails,
} from "@/features/analytics/hooks/categorias";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { labelToTownId } from "@/lib/utils/core/sector";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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
    endISO, // YYYY-MM-DD cuando estás en "range"; undefined si estás en "granularity"
  } = useTagTimeframe();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Usar la misma lógica que Home: siempre incluir endDate
  const timeParams =
    mode === "range"
      ? {
          startISO: startDate.toISOString().split("T")[0],
          endISO: endDate.toISOString().split("T")[0],
        }
      : { endISO: endDate.toISOString().split("T")[0] };

  const { state, ids, itemsById } = useCategoriesTotals(
    granularity,
    timeParams
  );

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

  // NIVEL 1 (base)
  const { series: seriesCat, donutData: donutCat } = useCategoryDetails(
    (drill?.kind === "category" ? drill.categoryId : catId) ??
      ("naturaleza" as CategoryId),
    granularity,
    endISO
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? itemsById[id as CategoryId]?.deltaPct ?? null
      : null;

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
  };

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
      />

      <SectorsGrid
        variant="detailed"
        mode="tag"
        ids={displayedIds}
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
        isDeltaLoading={state.status !== "ready"}
        // NIVEL 2 (drill)
        level2Data={(() => {
          const result =
            drill?.kind === "town+cat"
              ? {
                  townId: drill.townId,
                  categoryId: drill.categoryId,
                  granularity,
                  endISO,
                }
              : undefined;
          return result;
        })()}
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
