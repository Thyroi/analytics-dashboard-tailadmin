"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTownTimeframe } from "@/features/analytics/context/TownTimeContext";
import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import { useTownDetails } from "@/features/home/hooks/useTownDetails";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  granularity: Granularity;
};

export default function SectorsByTownSection({ granularity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener fechas del contexto
  const { getCurrentPeriod } = useTownTimeframe();
  const { start: startDateStr, end: endDateStr } = getCurrentPeriod();

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
    () => townResumenResult.data.map((item) => item.id),
    [townResumenResult.data]
  );

  const townId = expandedId as TownId | null;

  // Llamar useTownDetails siempre (React hooks rule)
  // Solo hace la llamada real cuando expandedId existe
  const detailsResult = useTownDetails(townId, granularity, endDateStr);

  const getDeltaPctFor = (id: string) =>
    itemsById[id as TownId]?.combinedDeltaPct ?? null;

  const getDeltaArtifactFor = (id: string) =>
    itemsById[id as TownId]?.deltaArtifact ?? null;

  const getSeriesFor = (_id: string) => {
    // Si está cargando o no coincide el ID expandido, devolver vacío
    if (detailsResult.isPending || !expandedId || _id !== expandedId) {
      return { current: [], previous: [] };
    }
    return detailsResult.series;
  };

  const getDonutFor = (_id: string) => {
    // Si está cargando o no coincide el ID expandido, devolver vacío
    if (detailsResult.isPending || !expandedId || _id !== expandedId) {
      return [];
    }
    return detailsResult.donutData;
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
        isDetailLoading={detailsResult.isPending}
      />
    </section>
  );
}
