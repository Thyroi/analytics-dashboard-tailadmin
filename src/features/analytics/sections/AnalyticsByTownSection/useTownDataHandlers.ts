import type { TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta/types";
import { useCallback, useMemo } from "react";

type QueryState = {
  status: "ready" | "loading" | "error" | "idle";
  [key: string]: unknown;
};

type TownItemsById = Record<
  TownId,
  {
    deltaPct: number | null;
    deltaArtifact: DeltaArtifact | null;
    [key: string]: unknown;
  }
>;

export function useTownDataHandlers(
  state: QueryState,
  itemsById: TownItemsById,
  townId: TownId | null,
  seriesTown: { current: SeriesPoint[]; previous: SeriesPoint[] } | null,
  donutTown: Array<{ label: string; value: number }> | null
) {
  const EMPTY_SERIES = useMemo(
    () => ({ current: [] as SeriesPoint[], previous: [] as SeriesPoint[] }),
    []
  );

  const getDeltaPctFor = useCallback(
    (id: string) =>
      state.status === "ready"
        ? itemsById[id as TownId]?.deltaPct ?? null
        : null,
    [state.status, itemsById]
  );

  const getDeltaArtifactFor = useCallback(
    (id: string) =>
      state.status === "ready"
        ? itemsById[id as TownId]?.deltaArtifact ?? null
        : null,
    [state.status, itemsById]
  );

  const getSeriesFor = useCallback(
    (_id: string) => {
      if (townId && _id === townId && seriesTown) return seriesTown;
      return EMPTY_SERIES;
    },
    [townId, seriesTown, EMPTY_SERIES]
  );

  const getDonutFor = useCallback(
    (_id: string) => {
      if (townId && _id === townId) {
        return (
          donutTown?.map((d) => ({ label: d.label, value: d.value })) || []
        );
      }
      return [];
    },
    [townId, donutTown]
  );

  return {
    getDeltaPctFor,
    getDeltaArtifactFor,
    getSeriesFor,
    getDonutFor,
  };
}
