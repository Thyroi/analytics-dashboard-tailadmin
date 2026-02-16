import type { CategoryId } from "@/lib/taxonomy/categories";
import type { SeriesPoint } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta/types";
import { useCallback, useMemo } from "react";

function filterVisibleDonutItems(
  items: Array<{ label: string; value: number }>,
): Array<{ label: string; value: number }> {
  const positiveItems = items.filter(
    (item) => Number.isFinite(item.value) && item.value > 0,
  );

  const total = positiveItems.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  return positiveItems.filter((item) => {
    const pct = (item.value / total) * 100;
    return Number(pct.toFixed(2)) > 0;
  });
}

type QueryState = {
  status: "ready" | "loading" | "error";
  [key: string]: unknown;
};

type CategoryItemsById = Record<
  CategoryId,
  {
    deltaPct: number | null;
    deltaArtifact: DeltaArtifact | null;
    [key: string]: unknown;
  }
>;

export function useCategoryDataHandlers(
  state: QueryState,
  itemsById: CategoryItemsById,
  catId: CategoryId | null,
  seriesCat: { current: SeriesPoint[]; previous: SeriesPoint[] } | null,
  donutCat: Array<{ label: string; value: number }> | null,
) {
  const EMPTY_SERIES = useMemo(
    () => ({ current: [] as SeriesPoint[], previous: [] as SeriesPoint[] }),
    [],
  );

  const getDeltaPctFor = useCallback(
    (id: string) =>
      state.status === "ready"
        ? (itemsById[id as CategoryId]?.deltaPct ?? null)
        : null,
    [state.status, itemsById],
  );

  const getDeltaArtifactFor = useCallback(
    (id: string) => {
      const artifact =
        state.status === "ready"
          ? (itemsById[id as CategoryId]?.deltaArtifact ?? null)
          : null;

      return artifact;
    },
    [state.status, itemsById],
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
    [catId, seriesCat, EMPTY_SERIES],
  );

  const getDonutFor = useCallback(
    (_id: string) => {
      if (catId && _id === catId) {
        // Verificación defensiva: asegurar que donutCat es un array
        return Array.isArray(donutCat)
          ? filterVisibleDonutItems(
              donutCat.map((d) => ({ label: d.label, value: d.value })),
            )
          : [];
      }
      return [];
    },
    [catId, donutCat],
  );

  return {
    getDeltaPctFor,
    getDeltaArtifactFor,
    getSeriesFor,
    getDonutFor,
  };
}
