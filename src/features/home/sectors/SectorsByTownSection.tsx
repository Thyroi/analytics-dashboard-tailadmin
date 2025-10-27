"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { getCorrectDatesForGranularity } from "@/lib/utils/time/deltaDateCalculation";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
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

  // Calcular rangos usando la lógica estándar de timeWindows
  const ranges = useMemo(() => {
    if (mode === "range") {
      // Modo range: usar fechas del contexto
      return computeRangesForKPI(
        granularity,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
    } else {
      // Modo preset: usar computeRangesForKPI con currentEndISO
      return computeRangesForKPI(granularity, null, currentEndISO);
    }
  }, [mode, startDate, endDate, currentEndISO, granularity]);

  // Usar hook combinado GA4 + Chatbot
  const townResumenResult = useResumenTown({
    granularity,
    startDate: ranges.current.start,
    endDate: ranges.current.end,
  });

  // Crear lookup map por ID para acceso eficiente
  const itemsById = useMemo(() => {
    return townResumenResult.data.reduce((acc, item) => {
      acc[item.id as TownId] = item;
      return acc;
    }, {} as Record<TownId, (typeof townResumenResult.data)[0]>);
  }, [townResumenResult]);

  const displayedIds = useMemo<string[]>(
    () => townResumenResult.data.map((item) => item.id),
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

  // Solo llamar useTownDetails si hay un townId expandido
  const { series, donutData } = useTownDetails(
    townId, // Pasar null cuando no hay nada expandido
    granularity,
    timeParamsForDetails
  );

  const getDeltaPctFor = (id: string) =>
    itemsById[id as TownId]?.combinedDeltaPct ?? null;

  const getDeltaArtifactFor = (id: string) =>
    itemsById[id as TownId]?.deltaArtifact ?? null;

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
        onGranularityChange={() => {}}
        getDeltaPctFor={getDeltaPctFor}
        getDeltaArtifactFor={getDeltaArtifactFor}
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
