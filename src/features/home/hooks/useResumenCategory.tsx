"use client";

import { useCategoriesTotalsNew } from "@/features/analytics/hooks/categorias/useCategoriesTotals";
import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { Granularity } from "@/lib/types";
import { computeCategoryAndTownTotals } from "@/lib/utils/chatbot/aggregate";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface UseResumenCategoryParams {
  granularity?: Granularity;
  startDate?: string;
  endDate?: string;
}

export function useResumenCategory(params: UseResumenCategoryParams = {}) {
  const { granularity = "d", startDate, endDate } = params;

  // Obtener datos completos de totales de categorías de Analytics
  const categoryTotalsQuery = useCategoriesTotalsNew({
    granularity,
    startDate,
    endDate,
  });

  // Obtener datos raw del chatbot con rangos KPI correctos
  const chatbotQuery = useQuery<ChatbotTotalsResponse>({
    queryKey: ["chatbot", "totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTotals({ granularity, startDate, endDate }),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  // Procesar datos raw del chatbot con la función aggregate
  const chatbotAggregated = useMemo(() => {
    if (!chatbotQuery.data) return null;
    try {
      return computeCategoryAndTownTotals(chatbotQuery.data);
    } catch (error) {
      console.warn("Error agregando datos del chatbot:", error);
      return null;
    }
  }, [chatbotQuery.data]);

  // Procesar datos para CategoryGrid combinando Analytics + Chatbot
  const processedData = useMemo(() => {
    if (!categoryTotalsQuery.data) return [];

    // Convertir datos de Analytics al formato CategoryGrid
    return categoryTotalsQuery.data.items.map((category) => {
      // Buscar datos correspondientes del chatbot
      const chatbotCategory = chatbotAggregated?.categories.find(
        (c) => c.id === category.id
      );

      // Calcular totales combinados
      const totalCurrent =
        category.total + (chatbotCategory?.currentTotal || 0);
      const totalPrevious =
        category.previousTotal + (chatbotCategory?.prevTotal || 0);

      // Calcular delta combinado usando función oficial (retorna null si prev <= 0)
      const combinedDelta = computeDeltaPct(totalCurrent, totalPrevious);

      // Debug temporal para primeras categorías
      // if (category.id === 'playas' || category.id === 'naturaleza') {
      //   console.log(`🧮 Delta Calculation - ${category.id}:`, {
      //     ga4: { current: category.total, prev: category.previousTotal },
      //     chatbot: { current: chatbotCategory?.currentTotal || 0, prev: chatbotCategory?.prevTotal || 0 },
      //     combined: { current: totalCurrent, prev: totalPrevious },
      //     delta: combinedDelta,
      //     note: combinedDelta === null ? "Sin datos suficientes (prev = 0)" : "Delta calculado"
      //   });
      // }

      return {
        categoryId: category.id,
        ga4Value: category.total,
        ga4PrevValue: category.previousTotal,
        chatbotValue: chatbotCategory?.currentTotal || 0,
        chatbotPrevValue: chatbotCategory?.prevTotal || 0,
        delta:
          combinedDelta !== null ? Math.round(combinedDelta * 10) / 10 : null, // null = "sin datos suficientes"
      };
    });
  }, [categoryTotalsQuery.data, chatbotAggregated]);

  return {
    categoriesData: processedData,
    rawQuery: categoryTotalsQuery.data,
    chatbotRawQuery: chatbotQuery.data,
    chatbotAggregated,
    isLoading: categoryTotalsQuery.isLoading || chatbotQuery.isLoading,
    error: categoryTotalsQuery.error || chatbotQuery.error,
    refetch: () => {
      categoryTotalsQuery.refetch();
      chatbotQuery.refetch();
    },
  };
}
