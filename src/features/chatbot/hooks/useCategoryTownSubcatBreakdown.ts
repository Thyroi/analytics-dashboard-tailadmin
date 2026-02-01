/**
 * Hook para obtener breakdown de subcategorías dentro de categoría+town
 *
 * NIVEL 2: Categoría+Town → Subcategorías (category-first, profundidad 4)
 *
 * React Query hook sin useEffect, con handlers para invalidate/refetch
 */

import {
  fetchCategoryTownSubcatBreakdown,
  type CategoryTownSubcatBreakdownResponse,
} from "@/lib/services/chatbot/categoryTownSubcatBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type UseCategoryTownSubcatBreakdownParams = {
  categoryId: CategoryId | null;
  townId: TownId | null;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  enabled?: boolean;
};

export type UseCategoryTownSubcatBreakdownResult = {
  data: CategoryTownSubcatBreakdownResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => Promise<void>;
};

/* ==================== Hook ==================== */

/**
 * Hook para obtener subcategorías dentro de categoría+town específico
 *
 * QueryKey incluye categoryId, townId, startISO, endISO, windowGranularity
 * para invalidación granular. No usa useEffect, fetch por handlers solamente.
 */
export function useCategoryTownSubcatBreakdown({
  categoryId,
  townId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "huelva",
  enabled = true,
}: UseCategoryTownSubcatBreakdownParams): UseCategoryTownSubcatBreakdownResult {
  const queryClient = useQueryClient();

  // QueryKey con todos los parámetros relevantes (incluye categoryId + townId como especifica el patrón)
  const queryKey = [
    "chatbot",
    "category",
    "town",
    "subcat-breakdown",
    {
      categoryId,
      townId,
      startISO,
      endISO,
      g: windowGranularity,
      db,
    },
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      // Solo ejecutar si categoryId y townId están presentes
      if (!categoryId || !townId) {
        throw new Error("categoryId and townId are required");
      }

      return fetchCategoryTownSubcatBreakdown({
        categoryId,
        townId,
        startISO,
        endISO,
        windowGranularity,
        db,
      });
    },
    enabled: enabled && !!categoryId && !!townId, // Solo ejecutar si ambos IDs están presentes
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
