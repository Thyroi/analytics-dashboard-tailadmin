/**
 * Hook para obtener detalles de un town específico - solo datos de chatbot
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchTownCategoryBreakdown,
  type TownCategoryBreakdownResponse,
} from "@/lib/services/chatbot/townCategoryBreakdown";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

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
  const chatbotQuery = useQuery<TownCategoryBreakdownResponse>({
    queryKey: [
      "chatbot",
      "town",
      "details",
      townId,
      granularity,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchTownCategoryBreakdown({
        townId,
        startISO: startDate ?? null,
        endISO: endDate ?? null,
        windowGranularity: granularity,
      }),
    enabled: enabled && !!townId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const processedData = useMemo(() => {
    if (!chatbotQuery.data || !townId) {
      return { status: "loading" } as const;
    }

    try {
      const result = chatbotQuery.data;
      const donutData = result.categories
        .filter((item) => item.currentTotal > 0)
        .map((item) => ({ label: item.label, value: item.currentTotal }));
      const series = result.series ?? { current: [], previous: [] };
      const totalInteractions = result.categories.reduce(
        (sum, item) => sum + item.currentTotal,
        0,
      );

      return {
        status: "ready" as const,
        series,
        donutData,
        totalInteractions,
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }, [chatbotQuery.data, townId]);

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
