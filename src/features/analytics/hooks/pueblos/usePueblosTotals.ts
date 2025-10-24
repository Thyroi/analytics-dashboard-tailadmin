/**
 * /features/analytics/hooks/pueblos/usePueblosTotals.ts
 * React Query hooks para totales de pueblos con wrapper de compatibilidad
 */

import {
  fetchPueblosTotals,
  type PueblosTotalsResponse,
} from "@/lib/services/pueblos/totals";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UsePueblosTotalsOptions = {
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
};

/**
 * Tipos para compatibilidad legacy
 */
export type LegacyTimeParams =
  | string // Solo endISO
  | { startISO: string; endISO: string } // Rango completo
  | { endISO: string }; // Solo endISO como objeto

export type ReadyState = {
  status: "ready";
  data: PueblosTotalsResponse;
  ids: TownId[];
  itemsById: Record<
    TownId,
    {
      title: string;
      total: number;
      deltaPct: number | null;
    }
  >;
};

export type LoadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | ReadyState;

/**
 * Hook principal con React Query - usa nueva lógica de calculatePreviousPeriodAndGranularity
 */
export function usePueblosTotalsNew(options: UsePueblosTotalsOptions = {}) {
  const {
    granularity,
    startDate,
    endDate,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutos
    refetchInterval,
  } = options;

  // Construir parámetros - granularity es opcional (API lo calcula automáticamente)
  const params = {
    ...(granularity && { granularity }),
    startDate,
    endDate,
  };

  // Validar que tenemos fechas requeridas
  const hasRequiredDates = !!(startDate && endDate);

  return useQuery({
    queryKey: ["pueblos-totals", params],
    queryFn: () => fetchPueblosTotals(params),
    enabled: Boolean(enabled && hasRequiredDates),
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook de compatibilidad legacy que mantiene la misma API que el original
 * Permite usar el nuevo endpoint manteniendo la misma API
 */
export function usePueblosTotals(
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

  const query = usePueblosTotalsNew({
    granularity,
    startDate,
    endDate,
  });

  // Transformar la respuesta al formato legacy
  const ready: ReadyState | null = query.data
    ? {
        status: "ready" as const,
        data: query.data,
        ids: query.data.data.items.map((item) => item.id),
        itemsById: Object.fromEntries(
          query.data.data.items.map((item) => [
            item.id,
            {
              title: item.title,
              total: item.total,
              deltaPct: item.deltaPct,
            },
          ])
        ) as Record<
          TownId,
          {
            title: string;
            total: number;
            deltaPct: number | null;
          }
        >,
      }
    : null;

  const state: LoadingState = query.error
    ? { status: "error", error: String(query.error) }
    : query.isLoading
    ? { status: "loading" }
    : ready || { status: "idle" };

  return {
    state,
    ids: ready?.ids || [],
    itemsById:
      ready?.itemsById ||
      ({} as Record<
        TownId,
        { title: string; total: number; deltaPct: number | null }
      >),
    isInitialLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

/**
 * Hook para solo datos actuales (preset con endDate)
 */
export function usePueblosTotalsCurrent(options: UsePueblosTotalsOptions = {}) {
  const query = usePueblosTotalsNew(options);
  return query.data?.data.items || [];
}

/**
 * Hook para obtener solo los datos cuando están listos
 */
export function usePueblosTotalsWithData(
  options: UsePueblosTotalsOptions = {}
) {
  const query = usePueblosTotalsNew(options);
  return query.data ? { data: query.data, isLoading: query.isLoading } : null;
}

/**
 * Hook para rango de fechas específico
 */
export function usePueblosTotalsDateRange(
  granularity: Granularity,
  startDate: string,
  endDate: string,
  options: Omit<
    UsePueblosTotalsOptions,
    "granularity" | "startDate" | "endDate"
  > = {}
) {
  return usePueblosTotalsNew({
    granularity,
    startDate,
    endDate,
    ...options,
  });
}

/**
 * Hook para datos de "hoy" (preset)
 */
export function usePueblosTotalsToday(options: UsePueblosTotalsOptions = {}) {
  const today = new Date().toISOString().split("T")[0];

  return usePueblosTotalsNew({
    granularity: "d",
    startDate: today,
    endDate: today,
    ...options,
  });
}

/**
 * Hook para datos del "último mes" (preset)
 */
export function usePueblosTotalsLastMonth(
  options: UsePueblosTotalsOptions = {}
) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const start = startDate.toISOString().split("T")[0];

  return usePueblosTotalsNew({
    granularity: "d",
    startDate: start,
    endDate,
    ...options,
  });
}
