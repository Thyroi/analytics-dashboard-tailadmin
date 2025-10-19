"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import type { TownId } from "@/lib/taxonomy/towns";
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
  const { currentEndISO } = getCorrectDatesForGranularity(
    endDate,
    granularity,
    mode
  );

  // Preparar parámetros de tiempo para useResumenTown
  const startDateStr = mode === "range" ? startDate.toISOString().split("T")[0] : null;
  const endDateStr = mode === "range" ? endDate.toISOString().split("T")[0] : currentEndISO;

  // Usar hook combinado GA4 + Chatbot
  const townResumenResult = useResumenTown({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });


  // Crear lookup map por ID para acceso eficiente
  const itemsById = useMemo(() => {
    return townResumenResult.data.reduce((acc, item) => {
      acc[item.id as TownId] = item;
      return acc;
    }, {} as Record<TownId, (typeof townResumenResult.data)[0]>);
  }, [townResumenResult]);

  const displayedIds = useMemo<string[]>(
    () => townResumenResult.data.map(item => item.id),
    [townResumenResult.data]
  );

  const townId = expandedId as TownId | null;
  
  // Preparar timeParams para useTownDetails (formato original)
  const timeParamsForDetails =
    mode === "range"
      ? {
          startISO: startDate.toISOString().split("T")[0],
          endISO: endDate.toISOString().split("T")[0],
        }
      : { endISO: currentEndISO };
  
  const { series, donutData } = useTownDetails(
    townId ?? ("almonte" as TownId),
    granularity,
    timeParamsForDetails
  );

  const getDeltaPctFor = (id: string) =>
    itemsById[id as TownId]?.combinedDeltaPct ?? null;

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
        isDeltaLoading={townResumenResult.isLoading}
      />
    </section>
  );
}
