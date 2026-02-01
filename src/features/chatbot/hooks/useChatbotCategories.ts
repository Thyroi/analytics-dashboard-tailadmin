/**
 * Hook para obtener categorías para chatbot
 * Versión simplificada usando la funcionalidad existente
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchChatbotCategoryTotals,
  type CategoryTotalsResponse,
} from "@/lib/services/chatbot/categoryTotals";
import { CATEGORY_META, CategoryId } from "@/lib/taxonomy/categories";
import { type Granularity } from "@/lib/types";

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
  // Query para totales por categoría (Mindsaic v2)
  const chatbotQuery = useQuery<CategoryTotalsResponse>({
    queryKey: ["chatbot", "category-totals", granularity, startDate, endDate],
    queryFn: () =>
      fetchChatbotCategoryTotals({ granularity, startDate, endDate }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  const categories = useMemo<CategoryCardData[]>(() => {
    if (!chatbotQuery.data?.categories) {
      return [];
    }

    const processedCategories = chatbotQuery.data.categories
      .filter((item) => item.id in CATEGORY_META)
      .map((category): CategoryCardData | null => {
        const categoryId = category.id as CategoryId;
        const categoryMeta = CATEGORY_META[categoryId];
        const currentValue = category.currentTotal;
        const previousValue = category.prevTotal;

        if (currentValue === 0 && previousValue === 0) {
          return null;
        }

        const deltaPercent = category.deltaPercent ?? undefined;
        const delta = category.deltaAbs;

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
  }, [chatbotQuery.data]);

  return {
    categories,
    isLoading: chatbotQuery.isLoading,
    isError: chatbotQuery.isError,
    error: chatbotQuery.error,
    refetch: chatbotQuery.refetch,
    rawData: chatbotQuery.data,
    aggregatedData: null,
  };
}
