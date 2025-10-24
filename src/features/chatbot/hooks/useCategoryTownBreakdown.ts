/**
 * Hook para obtener breakdown de towns dentro de una categoría
 *
 * NIVEL 1: Categoría → Towns (category-first, profundidad 3)
 *
 * React Query hook sin useEffect, con handlers para invalidate/refetch
 */

import {
  fetchCategoryTownBreakdown,
  type CategoryTownBreakdownResponse,
} from "@/lib/services/chatbot/categoryTownBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type UseCategoryTownBreakdownParams = {
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  enabled?: boolean;
  representativeCategoryRaw?: string | null;
};

export type UseCategoryTownBreakdownResult = {
  data: CategoryTownBreakdownResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => Promise<void>;
};

/* ==================== Hook ==================== */

/**
 * Hook para obtener towns dentro de una categoría específica
 *
 * QueryKey incluye categoryId, startISO, endISO, windowGranularity para invalidación granular
 * No usa useEffect, fetch por handlers solamente
 */
export function useCategoryTownBreakdown({
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
  enabled = true,
  representativeCategoryRaw = null,
}: UseCategoryTownBreakdownParams): UseCategoryTownBreakdownResult {
  const queryClient = useQueryClient();

  // QueryKey con todos los parámetros relevantes (incluye categoryId como especifica el patrón)
  const queryKey = [
    "chatbot",
    "category",
    "town-breakdown",
    {
      categoryId,
      representativeCategoryRaw,
      startISO,
      endISO,
      g: windowGranularity,
      db,
    },
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      return fetchCategoryTownBreakdown({
        categoryId,
        representativeCategoryRaw,
        startISO,
        endISO,
        windowGranularity,
        db,
      });
    },
    enabled: enabled && !!categoryId, // Solo ejecutar si categoryId está presente
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handler para invalidar query (usado por onRangeChange, onGranularityChange)
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
