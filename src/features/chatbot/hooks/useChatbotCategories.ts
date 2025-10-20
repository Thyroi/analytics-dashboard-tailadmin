/**
 * Hook para obtener categorías para chatbot
 * Versión simplificada usando la funcionalidad existente
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { fetchChatbotTotals } from "@/lib/services/chatbot/totals";
import { CATEGORY_META, CategoryId } from "@/lib/taxonomy/categories";
import { type Granularity } from "@/lib/types";
import { computeCategoryAndTownTotals } from "@/lib/utils/chatbot/aggregate";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";

export type CategoryCardData = {
  id: CategoryId;
  label: string;
  iconSrc: string;
  currentValue: number;
  previousValue?: number;
  delta?: number;
  deltaPercent?: number;
};

export type UseChatbotCategoriesOptions = {
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
};

export function useChatbotCategories({
  granularity,
  startDate,
  endDate,
  enabled = true,
}: UseChatbotCategoriesOptions) {
  // Query para datos raw del chatbot usando fetchChatbotTotals
  const chatbotQuery = useQuery({
    queryKey: ["chatbot", "totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTotals({ granularity, startDate, endDate }),
    enabled,
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
      console.error("Error agregando datos del chatbot:", error);
      return null;
    }
  }, [chatbotQuery.data]);

  const categories = useMemo<CategoryCardData[]>(() => {
    if (!chatbotAggregated?.categories) {
      return [];
    }

    const validCategories = chatbotAggregated.categories.filter(
      (item) => item.id in CATEGORY_META
    );

    const processedCategories = validCategories
      .map((category): CategoryCardData | null => {
        const categoryId = category.id as CategoryId;
        const categoryMeta = CATEGORY_META[categoryId];
        const currentValue = category.currentTotal;
        const previousValue = category.prevTotal;

        if (currentValue === 0 && previousValue === 0) {
          return null;
        }

        // Calcular delta usando función oficial
        const deltaPercent =
          computeDeltaPct(currentValue, previousValue) ?? undefined;
        const delta = currentValue - previousValue;

        const result = {
          id: categoryId,
          label: categoryMeta.label,
          iconSrc: categoryMeta.iconSrc,
          currentValue,
          previousValue,
          delta,
          deltaPercent,
        };

        return result;
      })
      .filter((cat): cat is CategoryCardData => cat !== null)
      .sort((a, b) => b.currentValue - a.currentValue); // Ordenar por valor descendente

    return processedCategories;
  }, [chatbotAggregated]);

  return {
    categories,
    isLoading: chatbotQuery.isLoading,
    isError: chatbotQuery.isError,
    error: chatbotQuery.error,
    refetch: chatbotQuery.refetch,
    rawData: chatbotQuery.data,
    aggregatedData: chatbotAggregated,
  };
}
