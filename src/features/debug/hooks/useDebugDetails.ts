/**
 * Hook para debug de discrepancias en details
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugDetails } from "../services/debugDetailsService";

export function useDebugDetails(params: {
  startDate: string;
  endDate: string;
  categoryId: CategoryId;
  townId: TownId;
  granularity: Granularity;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["debug-details", params],
    queryFn: () => fetchDebugDetails(params),
    enabled: params.enabled ?? true,
    staleTime: 0, // Siempre fresh para debug
    refetchOnWindowFocus: false,
  });
}
