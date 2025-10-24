/**
 * Hook para obtener breakdown de categorías dentro de un town
 *
 * NIVEL 1: Town → Categorías (profundidad 3)
 *
 * React Query hook sin useEffect, con handlers para invalidate/refetch
 */

import {
  fetchTownCategoryBreakdown,
  type TownCategoryBreakdownResponse,
} from "@/lib/services/chatbot/townCategoryBreakdown";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type UseTownCategoryBreakdownParams = {
  townId: TownId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  enabled?: boolean;
};

export type UseTownCategoryBreakdownResult = {
  data: TownCategoryBreakdownResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  invalidate: () => Promise<void>;
};

/* ==================== Hook ==================== */

/**
 * Hook para obtener categorías dentro de un town específico
 *
 * QueryKey incluye townId, startISO, endISO, windowGranularity para invalidación granular
 * No usa useEffect, fetch por handlers solamente
 */
export function useTownCategoryBreakdown({
  townId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
  enabled = true,
}: UseTownCategoryBreakdownParams): UseTownCategoryBreakdownResult {
  const queryClient = useQueryClient();

  // QueryKey con todos los parámetros relevantes (incluye townId como especifica PR #11)
  const queryKey = [
    "chatbot",
    "town",
    "category-breakdown",
    {
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
      return fetchTownCategoryBreakdown({
        townId,
        startISO,
        endISO,
        windowGranularity,
        db,
      });
    },
    enabled: enabled && !!townId, // Solo ejecutar si townId está presente
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
