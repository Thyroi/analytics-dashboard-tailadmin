/**
 * Hook para obtener categorías para chatbot
 * Versión simplificada usando la funcionalidad existente
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTagAudit, PATTERNS } from "../services/tagAudit";
import type { Granularity } from "../types";

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
  enabled?: boolean;
};

/**
 * Agrega valores por categoría desde el output de la API
 */
function aggregateByCategory(
  output: Record<string, Array<{ time: string; value: number }>>
) {
  const categoryTotals: Record<CategoryId, number> = {} as Record<
    CategoryId,
    number
  >;

  // Inicializar con 0
  CATEGORY_ID_ORDER.forEach((id) => {
    categoryTotals[id] = 0;
  });

  // Buscar claves que empiecen con root.{categoria}
  Object.entries(output).forEach(([key, points]) => {
    if (!key.startsWith("root.")) return;

    const segments = key.split(".");
    if (segments.length < 2) return;

    const firstSegment = segments[1].toLowerCase();

    // Buscar coincidencias con categorías conocidas
    for (const categoryId of CATEGORY_ID_ORDER) {
      const categoryLabel = CATEGORY_META[categoryId].label.toLowerCase();
      const categoryIdLower = categoryId.toLowerCase();

      if (
        firstSegment === categoryIdLower ||
        firstSegment === categoryLabel.replace(/\s+/g, "")
      ) {
        const total = points.reduce((sum, point) => sum + point.value, 0);
        categoryTotals[categoryId] += total;
        break;
      }
    }
  });

  return categoryTotals;
}

export function useChatbotCategories({
  granularity,
  enabled = true,
}: UseChatbotCategoriesOptions) {
  const queryResult = useQuery({
    queryKey: ["chatbot-categories", granularity],
    queryFn: async () => {
      const response = await fetchTagAudit({
        patterns: PATTERNS.allCategories(),
        granularity,
      });

      return response;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categories = useMemo<CategoryCardData[]>(() => {
    if (!queryResult.data?.output) return [];

    const categoryTotals = aggregateByCategory(queryResult.data.output);

    return CATEGORY_ID_ORDER.map((categoryId): CategoryCardData | null => {
      const value = categoryTotals[categoryId];

      if (value === 0) return null;

      const categoryMeta = CATEGORY_META[categoryId];

      return {
        id: categoryId,
        label: categoryMeta.label,
        iconSrc: categoryMeta.iconSrc,
        currentValue: value,
        // Delta será opcional por ahora
        previousValue: undefined,
        delta: undefined,
        deltaPercent: undefined,
      };
    }).filter((cat): cat is CategoryCardData => cat !== null);
  }, [queryResult.data]);

  return {
    categories,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
