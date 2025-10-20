/**
 * Hook para obtener towns para chatbot - basado en useResumenTown
 * Solo datos de chatbot (sin GA4)
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import { type Granularity } from "@/lib/types";
import { computeCategoryAndTownTotals } from "@/lib/utils/chatbot/aggregate";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";

export type TownCardData = {
  id: TownId;
  label: string;
  iconSrc: string;
  currentValue: number;
  previousValue?: number;
  delta?: number;
  deltaPercent?: number;
};

export type UseChatbotTownsOptions = {
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
};

export function useChatbotTowns({
  granularity,
  startDate,
  endDate,
  enabled = true,
}: UseChatbotTownsOptions) {
  // Query para datos raw del chatbot (igual que useResumenTown)
  const chatbotQuery = useQuery<ChatbotTotalsResponse>({
    queryKey: ["chatbot", "totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTotals({ granularity, startDate, endDate }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  // Procesar datos raw del chatbot con la función aggregate (igual que useResumenTown)
  const chatbotAggregated = useMemo(() => {
    if (!chatbotQuery.data) return null;
    try {
      return computeCategoryAndTownTotals(chatbotQuery.data);
    } catch (error) {
      console.warn("Error agregando datos del chatbot:", error);
      return null;
    }
  }, [chatbotQuery.data]);

  const towns = useMemo<TownCardData[]>(() => {
    if (!chatbotAggregated?.towns) {
      return [];
    }

    const processedTowns = TOWN_ID_ORDER
      .map((townId): TownCardData | null => {
        const townMeta = TOWN_META[townId];
        
        if (!townMeta) {
          return null;
        }

        // Buscar datos del town en los resultados agregados
        const chatbotTown = chatbotAggregated.towns.find(
          (town) => town.id === townId
        );

        const currentValue = chatbotTown?.currentTotal ?? 0;
        const previousValue = chatbotTown?.prevTotal ?? 0;

        // Solo mostrar towns con datos
        if (currentValue === 0 && previousValue === 0) {
          return null;
        }

        // Calcular delta usando función oficial
        const deltaPercent = computeDeltaPct(currentValue, previousValue) ?? undefined;
        const delta = currentValue - previousValue;

        return {
          id: townId,
          label: townMeta.label,
          iconSrc: townMeta.iconSrc,
          currentValue,
          previousValue,
          delta,
          deltaPercent,
        };
      })
      .filter((town): town is TownCardData => town !== null)
      .sort((a, b) => b.currentValue - a.currentValue); // Ordenar por valor descendente

    return processedTowns;
  }, [chatbotAggregated]);

  return {
    towns,
    isLoading: chatbotQuery.isLoading,
    isError: chatbotQuery.isError,
    error: chatbotQuery.error,
    refetch: chatbotQuery.refetch,
    rawData: chatbotQuery.data,
    aggregatedData: chatbotAggregated,
  };
}