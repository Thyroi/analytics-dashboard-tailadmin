/**
 * Hook para obtener totales + deltas de categorías del chatbot con React Query
 *
 * Características:
 * - React Query con invalidateQueries / refetch
 * - Sin useEffect: requests se disparan por handlers
 * - Query key basado en granularidad, start/end, db
 * - Handlers obligatorios para cambios de estado
 */

import {
  fetchChatbotCategoryTotals,
  type CategoryTotalData,
  type CategoryTotalsResponse,
} from "@/lib/services/chatbot/categoryTotals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type CategoryCardData = {
  id: CategoryId;
  label: string;
  iconSrc: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPercent: number | null;
};

export type UseChatbotCategoryTotalsParams = {
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
};

export type UseChatbotCategoryTotalsResult = {
  categories: CategoryCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  meta: CategoryTotalsResponse["meta"] | null;
};

/* ==================== Helper Functions ==================== */

/**
 * Construye la query key para React Query
 */
function buildQueryKey(params: UseChatbotCategoryTotalsParams): unknown[] {
  return [
    "chatbotTotals",
    "categories",
    {
      g: params.granularity,
      start: params.startDate ?? null,
      end: params.endDate ?? null,
      db: params.db ?? "project_huelva",
    },
  ];
}

/**
 * Transforma CategoryTotalData a CategoryCardData para compatibilidad con UI
 */
function transformToCardData(data: CategoryTotalData): CategoryCardData {
  return {
    id: data.id,
    label: data.label,
    iconSrc: data.iconSrc,
    currentValue: data.currentTotal,
    previousValue: data.prevTotal,
    delta: data.deltaAbs,
    deltaPercent: data.deltaPercent,
  };
}

/* ==================== Hook Principal ==================== */

/**
 * Hook para obtener totales de categorías del chatbot
 *
 * NO usa useEffect. Los fetches se disparan por:
 * - Cambios en granularity/startDate/endDate (automático via query key)
 * - Handlers manuales (invalidateQueries + refetch)
 *
 * @example
 * ```tsx
 * const { categories, isLoading, refetch } = useChatbotCategoryTotals({
 *   granularity: 'd',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 * ```
 */
export function useChatbotCategoryTotals(
  params: UseChatbotCategoryTotalsParams
): UseChatbotCategoryTotalsResult {
  const query = useQuery({
    queryKey: buildQueryKey(params),
    queryFn: () =>
      fetchChatbotCategoryTotals({
        granularity: params.granularity,
        startDate: params.startDate,
        endDate: params.endDate,
        db: params.db,
      }),
    staleTime: 0, // Siempre considerar datos stale
    gcTime: 5 * 60 * 1000, // 5 minutos de garbage collection
    retry: 1, // Solo 1 reintento en caso de error
    enabled: true, // Siempre habilitado, control por handlers
  });

  // Transformar datos para la UI
  const categories: CategoryCardData[] =
    query.data?.categories.map(transformToCardData) || [];

  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    meta: query.data?.meta || null,
  };
}

/* ==================== Handlers para Componentes ==================== */

/**
 * Hook helper que devuelve handlers para invalidar/refetch
 * Usar en componentes padre que manejan controles de granularidad/rango
 */
export function useChatbotCategoryHandlers() {
  const queryClient = useQueryClient();

  return {
    /**
     * Invalida y refetchea cuando cambia granularidad
     * Llamar desde onChange del selector de granularidad
     */
    onGranularityChange: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chatbotTotals", "categories"],
      });
    },

    /**
     * Invalida y refetchea cuando cambia el rango
     * Llamar desde onChange del date picker
     */
    onRangeChange: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chatbotTotals", "categories"],
      });
    },

    /**
     * Invalida y refetchea cuando se limpia el rango
     * Llamar desde botón de "clear range"
     */
    onClearRange: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chatbotTotals", "categories"],
      });
    },

    /**
     * Refetch manual (sin invalidar cache)
     * Llamar desde botón de "refresh"
     */
    onRefresh: async () => {
      await queryClient.refetchQueries({
        queryKey: ["chatbotTotals", "categories"],
      });
    },
  };
}

/* ==================== Re-exports ==================== */

export type { CategoryTotalData, CategoryTotalsResponse };
