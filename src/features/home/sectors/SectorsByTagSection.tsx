"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import {
  useCategoryDetails,
  type TimeParams,
} from "@/features/home/hooks/useCategoryDetails";
import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { useMemo, useState } from "react";

type Props = {
  granularity: Granularity;
};

export default function SectorsByTagSection({ granularity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener fechas del contexto usando getCurrentPeriod (igual que debug)
  const { getCurrentPeriod } = useTagTimeframe();

  // Usar getCurrentPeriod() para obtener las fechas correctas (igual que debug)
  const { start: startDateStr, end: endDateStr } = getCurrentPeriod();

  // Usar useResumenCategory para obtener deltas combinados (GA4 + Chatbot)
  const { categoriesData, isLoading } = useResumenCategory({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  // Convertir datos a formato compatible con SectorsGrid
  const itemsById = useMemo(() => {
    const result: Record<
      string,
      { deltaPct: number | null; deltaArtifact: DeltaArtifact }
    > = {};
    categoriesData.forEach(
      (item: {
        categoryId: string;
        delta: number | null;
        deltaArtifact: DeltaArtifact;
      }) => {
        result[item.categoryId] = {
          deltaPct: item.delta,
          deltaArtifact: item.deltaArtifact,
        };
      }
    );
    return result;
  }, [categoriesData]);

  // Filtrar "otros" de las categorías mostradas
  const displayedIds = useMemo<string[]>(
    () => CATEGORY_ID_ORDER.filter((id) => id !== "otros"),
    []
  );

  const catId = expandedId as CategoryId | null;

  // Usar el nuevo hook con parámetros de fecha apropiados
  // IMPORTANTE: Siempre pasar startISO y endISO para que el hook tenga el rango completo
  const timeParams: TimeParams = useMemo(() => {
    return {
      startISO: startDateStr,
      endISO: endDateStr,
    };
  }, [startDateStr, endDateStr]);

  // Solo llamar useCategoryDetails si hay un catId expandido
  const { series, donutData, isPending } = useCategoryDetails(
    catId, // Pasar null cuando no hay nada expandido
    granularity,
    timeParams
  );

  const getDeltaPctFor = (id: string) => itemsById[id]?.deltaPct ?? null;

  const getDeltaArtifactFor = (id: string) =>
    itemsById[id]?.deltaArtifact ?? null;

  const getSeriesFor = (_id: string) =>
    catId && _id === catId ? series : { current: [], previous: [] };

  const getDonutFor = (_id: string) =>
    catId && _id === catId ? donutData : [];

  return (
    <section className="max-w-[1560px]">
      <SectorsGrid
        variant="simple"
        mode="tag"
        ids={displayedIds}
        granularity={granularity}
        onGranularityChange={() => {}} // No usado, controlado por el sticky header
        getDeltaPctFor={getDeltaPctFor}
        getDeltaArtifactFor={getDeltaArtifactFor}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={setExpandedId}
        onClose={() => setExpandedId(null)}
        isDeltaLoading={isLoading}
        isDetailLoading={isPending}
      />
    </section>
  );
}
