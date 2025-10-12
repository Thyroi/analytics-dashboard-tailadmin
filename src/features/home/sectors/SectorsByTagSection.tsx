"use client";

import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import {
  useCategoriesTotals,
  useCategoryDetails,
} from "@/features/analytics/hooks/categorias";
import SectorsGrid from "@/features/home/sectors/SectorsGrid";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  granularity: Granularity;
};

export default function SectorsByTagSection({ granularity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener fechas del contexto
  const { startDate, endDate, mode } = useTagTimeframe();

  // Preparar parámetros de tiempo para los hooks
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

  const catId = expandedId as CategoryId | null;

  // Usar el nuevo hook con parámetros de fecha apropiados
  const { series, donutData } = useCategoryDetails(
    catId ?? ("naturaleza" as CategoryId),
    granularity,
    endDate.toISOString().split("T")[0], // endISO
    mode === "range" ? startDate.toISOString().split("T")[0] : undefined // startISO
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? itemsById[id as CategoryId]?.deltaPct ?? null
      : null;

  const getSeriesFor = (_id: string) =>
    catId && _id === catId ? series : { current: [], previous: [] };

  const getDonutFor = (_id: string) =>
    catId && _id === catId ? donutData : [];

  return (
    <section className="max-w-[1560px]">
      <SectorsGrid
        mode="tag"
        ids={displayedIds}
        granularity={granularity}
        onGranularityChange={() => {}} // No usado, controlado por el sticky header
        getDeltaPctFor={getDeltaPctFor}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={setExpandedId}
        onClose={() => setExpandedId(null)}
        isDeltaLoading={state.status !== "ready"}
      />
    </section>
  );
}
