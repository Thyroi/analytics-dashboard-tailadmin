/**
 * Hook para obtener towns para chatbot - basado en useResumenTown
 * Solo datos de chatbot (sin GA4)
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchChatbotTownTotals,
  type TownTotalsResponse,
} from "@/lib/services/chatbot/townTotals";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import { type Granularity } from "@/lib/types";

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
  // Query para totales por town (Mindsaic v2)
  const chatbotQuery = useQuery<TownTotalsResponse>({
    queryKey: ["chatbot", "town-totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTownTotals({ granularity, startDate, endDate }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  const towns = useMemo<TownCardData[]>(() => {
    const processedTowns = TOWN_ID_ORDER.map((townId): TownCardData | null => {
      const townMeta = TOWN_META[townId];

      if (!townMeta) {
        return null;
      }

      // Buscar datos del town en los resultados agregados
      const chatbotTown = chatbotQuery.data?.towns.find(
        (town) => town.id === townId,
      );

      const currentValue = chatbotTown?.currentTotal ?? 0;
      const previousValue = chatbotTown?.prevTotal ?? 0;

      // Solo mostrar towns con datos
      if (currentValue === 0 && previousValue === 0) {
        return null;
      }

      const deltaPercent = chatbotTown?.deltaPercent ?? undefined;
      const delta = chatbotTown?.deltaAbs ?? currentValue - previousValue;

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
  }, [chatbotQuery.data]);

  return {
    towns,
    isLoading: chatbotQuery.isLoading,
    isError: chatbotQuery.isError,
    error: chatbotQuery.error,
    refetch: chatbotQuery.refetch,
    rawData: chatbotQuery.data,
    aggregatedData: null,
  };
}
