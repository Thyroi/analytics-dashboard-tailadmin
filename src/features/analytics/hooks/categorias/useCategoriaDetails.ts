/**
 * /features/analytics/hooks/categorias/useCategoriaDetails.ts
 * Hook para obtener detalles de una categoría específica con React Query
 */

import {
  fetchCategoriaDetails,
  type CategoriaDetailsParams,
  type CategoriaDetailsResponse,
  type DonutData,
  type SeriesData,
} from "@/lib/services/categorias/details";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

/** Opciones del hook */
export type UseCategoriaDetailsOptions = {
  categoryId: CategoryId;
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
  data: CategoriaDetailsResponse;
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

type CategoriaDetailsState = LoadingState | ReadyState | ErrorState;

/** Series vacías por defecto */
const EMPTY_SERIES: SeriesData = { current: [], previous: [] };
const EMPTY_DONUT: DonutData = [];

/**
 * Hook principal para obtener detalles de una categoría específica desde GA4
 */
export function useCategoriaDetails(
  options: UseCategoriaDetailsOptions
): CategoriaDetailsState {
  const {
    categoryId,
    granularity = "d",
    startDate,
    endDate,
    enabled = true,
    refetchInterval,
  } = options;

  const queryKey = [
    "categoria-details",
    categoryId,
    granularity,
    startDate,
    endDate,
  ];

  const queryParams: CategoriaDetailsParams = {
    categoryId,
    granularity,
    startDate,
    endDate,
  };

  const query = useQuery({
    queryKey,
    queryFn: () => fetchCategoriaDetails(queryParams),
    enabled: enabled && !!categoryId,
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
 * Usado por componentes que espera series y donutData directamente
 */
export function useCategoryDetails(
  categoryId: CategoryId,
  granularity: Granularity,
  endISO?: string,
  startISO?: string
): { series: SeriesData; donutData: DonutData } {
  const detailsState = useCategoriaDetails({
    categoryId,
    granularity,
    startDate: startISO,
    endDate: endISO,
  });

  return {
    series: detailsState.series,
    donutData: detailsState.donutData,
  };
}
