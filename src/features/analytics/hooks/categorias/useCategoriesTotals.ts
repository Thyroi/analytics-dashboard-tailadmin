/**
 * /features/analytics/hooks/categorias/useCategoriesTotals.ts
 * Hook para obtener totales de categorías con React Query
 */

import {
  fetchCategoriesTotals,
  type CategoriesTotalsParams,
  type CategoriesTotalsResponse,
} from "@/lib/services/categorias/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

/** Opciones del hook */
export type UseCategoriesTotalsOptions = {
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
  refetchInterval?: number;
};

/** Interfaz legacy para compatibilidad con el componente existente */
export type LegacyTimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | string
  | undefined;

type ReadyState = {
  status: "ready";
  data: CategoriesTotalsResponse;
  ids: CategoryId[];
  itemsById: Record<
    CategoryId,
    { title: string; total: number; deltaPct: number | null }
  >;
};

/**
 * Hook principal para obtener totales de categorías desde GA4
 */
export function useCategoriesTotalsNew(
  options: UseCategoriesTotalsOptions = {}
) {
  const {
    granularity = "d",
    startDate,
    endDate,
    enabled = true,
    refetchInterval,
  } = options;

  const params: CategoriesTotalsParams = {
    granularity,
    startDate,
    endDate,
  };

  return useQuery({
    queryKey: ["analytics", "categorias", "totals", params],
    queryFn: () => fetchCategoriesTotals(params),
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook compatible con la interfaz legacy del componente existente
 * Permite usar el nuevo endpoint manteniendo la misma API
 */
export function useCategoriesTotals(
  granularity: Granularity,
  time?: LegacyTimeParams
) {
  // Convertir los parámetros legacy al nuevo formato
  let startDate: string | null = null;
  let endDate: string | null = null;

  if (typeof time === "string") {
    // Solo endISO
    endDate = time;
  } else if (time && typeof time === "object") {
    if ("startISO" in time && "endISO" in time) {
      // Rango completo
      startDate = time.startISO;
      endDate = time.endISO;
    } else if ("endISO" in time) {
      // Solo endISO
      endDate = time.endISO || null;
    }
  }

  const query = useCategoriesTotalsNew({
    granularity,
    startDate,
    endDate,
  });

  // DEBUG: Log de parámetros convertidos
  console.log("🎯 DEBUG useCategoriesTotals legacy wrapper:", {
    originalTime: time,
    convertedParams: { granularity, startDate, endDate },
  });

  // Transformar la respuesta al formato legacy
  const ready: ReadyState | null = query.data
    ? {
        status: "ready" as const,
        data: query.data,
        ids: query.data.items.map((item) => item.id),
        itemsById: query.data.items.reduce((acc, item) => {
          acc[item.id] = {
            title: item.title,
            total: Number.isFinite(item.total) ? item.total : 0,
            deltaPct:
              typeof item.deltaPct === "number" &&
              Number.isFinite(item.deltaPct)
                ? item.deltaPct
                : null,
          };
          return acc;
        }, {} as ReadyState["itemsById"]),
      }
    : null;

  return {
    state: ready ?? ({ status: "loading" } as const),
    ids: ready?.ids ?? [],
    itemsById: ready?.itemsById ?? ({} as ReadyState["itemsById"]),
    isInitialLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook simplificado para obtener solo datos actuales
 */
export function useCategoriesTotalsCurrent(
  options: UseCategoriesTotalsOptions = {}
) {
  const query = useCategoriesTotalsNew(options);

  return {
    ...query,
    data: query.data?.items.map((item) => ({
      id: item.id,
      title: item.title,
      total: item.total,
    })),
  };
}

/**
 * Hook para obtener solo categorías con datos
 */
export function useCategoriesTotalsWithData(
  options: UseCategoriesTotalsOptions = {}
) {
  const query = useCategoriesTotalsNew(options);

  return {
    ...query,
    data: query.data?.items.filter((item) => item.total > 0),
  };
}

/**
 * Hook para obtener datos con rango de fechas específico
 */
export function useCategoriesTotalsDateRange(
  startDate: string,
  endDate: string,
  granularity: Granularity = "d",
  options: Omit<
    UseCategoriesTotalsOptions,
    "startDate" | "endDate" | "granularity"
  > = {}
) {
  return useCategoriesTotalsNew({
    ...options,
    granularity,
    startDate,
    endDate,
  });
}

/**
 * Hook para obtener datos de hoy
 */
export function useCategoriesTotalsToday(
  options: UseCategoriesTotalsOptions = {}
) {
  const today = new Date().toISOString().split("T")[0];

  return useCategoriesTotalsNew({
    ...options,
    granularity: "d",
    startDate: today,
    endDate: today,
  });
}

/**
 * Hook para obtener datos del último mes
 */
export function useCategoriesTotalsLastMonth(
  options: UseCategoriesTotalsOptions = {}
) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const start = startDate.toISOString().split("T")[0];

  return useCategoriesTotalsNew({
    ...options,
    granularity: "d",
    startDate: start,
    endDate,
  });
}
