"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import { usePueblosTotals } from "@/features/analytics/hooks/pueblos";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { getCorrectDatesForGranularity } from "@/lib/utils/time/deltaDateCalculation";
import { useMemo, useState } from "react";

type Props = {
  granularity: Granularity;
};

export default function SectorsByTownSection({ granularity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener fechas del contexto
  const { startDate, endDate, mode } = useTownTimeframe();

  // Calcular fechas correctas según granularidad
  const { currentEndISO } = getCorrectDatesForGranularity(endDate, granularity, mode);

  // Preparar parámetros de tiempo para los hooks
  const timeParams =
    mode === "range"
      ? {
          startISO: startDate.toISOString().split("T")[0],
          endISO: endDate.toISOString().split("T")[0],
        }
      : { endISO: currentEndISO };

  const { state, ids, itemsById } = usePueblosTotals(granularity, timeParams);
  const displayedIds = useMemo<string[]>(
    () => (state.status === "ready" ? (ids as string[]) : [...TOWN_ID_ORDER]),
    [state.status, ids]
  );

  const townId = expandedId as TownId | null;
  const { series, donutData } = useTownDetails(
    townId ?? ("almonte" as TownId),
    granularity,
    timeParams
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? itemsById[id as TownId]?.deltaPct ?? null : null;

  const getSeriesFor = (_id: string) => {
    return townId && _id === townId ? series : { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    return townId && _id === townId ? donutData : [];
  };

  return (
    <section className="max-w-[1560px]">
      <SectorsGrid
        variant="simple"
        mode="town"
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
