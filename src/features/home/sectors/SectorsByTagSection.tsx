"use client";

import SectorsGrid from "@/components/common/SectorsGrid";
import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import { useCategoryDetails } from "@/features/analytics/hooks/categorias";
import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { getCorrectDatesForGranularity } from "@/lib/utils/time/deltaDateCalculation";
import { useMemo, useState } from "react";

type Props = {
  granularity: Granularity;
};

export default function SectorsByTagSection({ granularity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Obtener fechas del contexto
  const { startDate, endDate, mode } = useTagTimeframe();

  // Calcular fechas correctas según granularidad
  const { currentEndISO } = getCorrectDatesForGranularity(
    endDate,
    granularity,
    mode
  );

  // Usar useResumenData para obtener deltas combinados (GA4 + Chatbot)
  const { categoriesData, isLoading } = useResumenCategory({
    granularity,
    startDate:
      mode === "range" ? startDate.toISOString().split("T")[0] : undefined,
    endDate:
      mode === "range" ? endDate.toISOString().split("T")[0] : currentEndISO,
  });

  // Convertir datos a formato compatible con SectorsGrid
  const itemsById = useMemo(() => {
    const result: Record<string, { deltaPct: number | null }> = {};
    categoriesData.forEach(
      (item: { categoryId: string; delta: number | null }) => {
        result[item.categoryId] = { deltaPct: item.delta };
      }
    );
    return result;
  }, [categoriesData]);

  const displayedIds = useMemo<string[]>(() => [...CATEGORY_ID_ORDER], []);

  const catId = expandedId as CategoryId | null;

  // Usar el nuevo hook con parámetros de fecha apropiados
  const { series, donutData } = useCategoryDetails(
    catId ?? ("naturaleza" as CategoryId),
    granularity,
    mode === "range" ? endDate.toISOString().split("T")[0] : currentEndISO, // endISO corregido
    mode === "range" ? startDate.toISOString().split("T")[0] : undefined // startISO
  );

  const getDeltaPctFor = (id: string) => itemsById[id]?.deltaPct ?? null;

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
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={setExpandedId}
        onClose={() => setExpandedId(null)}
        isDeltaLoading={isLoading}
      />
    </section>
  );
}
