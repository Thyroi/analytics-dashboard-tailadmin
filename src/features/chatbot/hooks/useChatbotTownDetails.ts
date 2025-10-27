/**
 * Hook para obtener detalles de un town específico - solo datos de chatbot
 * Basado en useTownDetails pero simplificado para chatbot únicamente
 *
 * POLÍTICA DE TIEMPO:
 * - Usa computeRangesForSeries de timeWindows.ts (comportamiento Series estándar)
 * - Granularidad "d" = 7 días para series (NO 1 día)
 * - Previous = ventana contigua del mismo tamaño
 * - Respeta rangos custom del usuario (startDate/endDate)
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { buildSeriesAndDonutFocused } from "@/lib/utils/data/seriesAndDonuts";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";

export type UseChatbotTownDetailsOptions = {
  townId: TownId;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
};

export function useChatbotTownDetails({
  townId,
  granularity,
  startDate,
  endDate,
  enabled = true,
}: UseChatbotTownDetailsOptions) {
  // Query para datos raw del chatbot
  const chatbotQuery = useQuery<ChatbotTotalsResponse>({
    queryKey: ["chatbot", "totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTotals({ granularity, startDate, endDate }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  // Procesar series y donut para el town específico
  const processedData = useMemo(() => {
    if (!chatbotQuery.data || !townId) {
      return { status: "loading" } as const;
    }

    try {
      // Usar computeRangesForSeries de timeWindows.ts (comportamiento Series estándar)
      const ranges = computeRangesForSeries(granularity, startDate, endDate);

      // Usar buildSeriesAndDonutFocused con focus en town
      const result = buildSeriesAndDonutFocused(
        {
          granularity,
          currentRange: ranges.current,
          prevRange: ranges.previous,
          focus: { type: "town", id: townId },
        },
        chatbotQuery.data
      );

      // Calcular total de interacciones
      const totalInteractions = result.series.current.reduce(
        (sum, point) => sum + point.value,
        0
      );

      return {
        status: "ready" as const,
        series: result.series,
        donutData: result.donutData,
        totalInteractions,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }, [chatbotQuery.data, townId, granularity, startDate, endDate]);

  return {
    state: processedData,
    series:
      processedData.status === "ready"
        ? processedData.series
        : { current: [], previous: [] },
    donutData: processedData.status === "ready" ? processedData.donutData : [],
    totalInteractions:
      processedData.status === "ready" ? processedData.totalInteractions : 0,
    isLoading: chatbotQuery.isLoading || processedData.status === "loading",
    isError: chatbotQuery.isError || processedData.status === "error",
    error:
      chatbotQuery.error ||
      (processedData.status === "error"
        ? new Error(processedData.message)
        : null),
    refetch: chatbotQuery.refetch,
  };
}
