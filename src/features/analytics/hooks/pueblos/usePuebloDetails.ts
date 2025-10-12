/**
 * /features/analytics/hooks/pueblos/usePuebloDetails.ts
 * Hook para obtener detalles de un pueblo específico con React Query
 */

import {
  fetchPuebloDetails,
  type DonutData,
  type PuebloDetailsParams,
  type PuebloDetailsResponse,
  type SeriesData,
} from "@/lib/services/pueblos/details";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

/** Opciones del hook */
export type UsePuebloDetailsOptions = {
  townId: TownId;
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
  refetchInterval?: number;
};

/** Estados del hook */
type LoadingState = {
  status: "loading";
  data: null;
  series: SeriesData;
  donutData: DonutData;
  deltaPct: null;
};

type ReadyState = {
  status: "ready";
  data: PuebloDetailsResponse;
  series: SeriesData;
  donutData: DonutData;
  deltaPct: number | null;
};

type ErrorState = {
  status: "error";
  error: Error;
  data: null;
  series: SeriesData;
  donutData: DonutData;
  deltaPct: null;
};

type PuebloDetailsState = LoadingState | ReadyState | ErrorState;

/** Series vacías por defecto */
const EMPTY_SERIES: SeriesData = { current: [], previous: [] };
const EMPTY_DONUT: DonutData = [];

/**
 * Hook principal para obtener detalles de un pueblo específico desde GA4
 */
export function usePuebloDetails(
  options: UsePuebloDetailsOptions
): PuebloDetailsState {
  const {
    townId,
    granularity = "d",
    startDate,
    endDate,
    enabled = true,
    refetchInterval,
  } = options;

  const queryKey = ["pueblo-details", townId, granularity, startDate, endDate];

  const queryParams: PuebloDetailsParams = {
    townId,
    granularity,
    startDate,
    endDate,
  };

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPuebloDetails(queryParams),
    enabled: enabled && !!townId,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  if (query.isLoading) {
    return {
      status: "loading",
      data: null,
      series: EMPTY_SERIES,
      donutData: EMPTY_DONUT,
      deltaPct: null,
    };
  }

  if (query.isError) {
    return {
      status: "error",
      error: query.error as Error,
      data: null,
      series: EMPTY_SERIES,
      donutData: EMPTY_DONUT,
      deltaPct: null,
    };
  }

  if (query.data) {
    return {
      status: "ready",
      data: query.data,
      series: query.data.series,
      donutData: query.data.donutData,
      deltaPct: query.data.deltaPct,
    };
  }

  // Fallback (no debería llegar aquí)
  return {
    status: "loading",
    data: null,
    series: EMPTY_SERIES,
    donutData: EMPTY_DONUT,
    deltaPct: null,
  };
}

/**
 * Hook legacy para compatibilidad con la interfaz existente
 * Usado por componentes que esperan series y donutData directamente
 */
export function useTownDetails(
  townId: TownId,
  granularity: Granularity,
  endISO?: string,
  startISO?: string
): { series: SeriesData; donutData: DonutData } {
  const detailsState = usePuebloDetails({
    townId,
    granularity,
    startDate: startISO,
    endDate: endISO,
  });

  return {
    series: detailsState.series,
    donutData: detailsState.donutData,
  };
}
