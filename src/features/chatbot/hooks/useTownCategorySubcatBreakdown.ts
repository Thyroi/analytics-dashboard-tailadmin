/**
 * Hook para obtener breakdown de subcategorías dentro de town+categoría
 *
 * NIVEL 2: Town+Categoría → Subcategorías (profundidad 4)
 *
 * React Query hook sin useEffect, con handlers para invalidate/refetch
 */

import {
  fetchTownCategorySubcatBreakdown,
  type TownCategorySubcatBreakdownResponse,
} from "@/lib/services/chatbot/townCategorySubcatBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type UseTownCategorySubcatBreakdownParams = {
  townId: TownId | null;
  categoryId: CategoryId | null;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  enabled?: boolean;
};

export type UseTownCategorySubcatBreakdownResult = {
  data: TownCategorySubcatBreakdownResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => Promise<void>;
};

/* ==================== Hook ==================== */

/**
 * Hook para obtener subcategorías dentro de un town+categoría específico
 *
 * QueryKey incluye townId, categoryId, startISO, endISO, windowGranularity
 * para invalidación granular. No usa useEffect, fetch por handlers solamente.
 */
export function useTownCategorySubcatBreakdown({
  townId,
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "huelva",
  enabled = true,
}: UseTownCategorySubcatBreakdownParams): UseTownCategorySubcatBreakdownResult {
  const queryClient = useQueryClient();

  // QueryKey con todos los parámetros relevantes (incluye townId + categoryId como especifica PR #13)
  const queryKey = [
    "chatbot",
    "town",
    "category",
    "subcat-breakdown",
    {
      townId,
      categoryId,
      startISO,
      endISO,
      g: windowGranularity,
      db,
    },
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      // Solo ejecutar si townId y categoryId están presentes
      if (!townId || !categoryId) {
        throw new Error("townId and categoryId are required");
      }

      return fetchTownCategorySubcatBreakdown({
        townId,
        categoryId,
        startISO,
        endISO,
        windowGranularity,
        db,
      });
    },
    enabled: enabled && !!townId && !!categoryId, // Solo ejecutar si ambos IDs están presentes
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
