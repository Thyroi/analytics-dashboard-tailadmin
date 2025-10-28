"use client";

import { useCategoriesTotalsNew } from "@/features/analytics/hooks/categorias/useCategoriesTotals";
import { useChatbotCategoryTotals } from "@/features/chatbot/hooks/useChatbotCategoryTotals";
import type { Granularity } from "@/lib/types";
import { computeDeltaArtifact } from "@/lib/utils/delta";
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

  // Usar el hook correcto de chatbot con pattern root.*.* (profundidad 2)
  const chatbotCategoryTotals = useChatbotCategoryTotals({
    granularity,
    startDate,
    endDate,
  });

  // Procesar datos para CategoryGrid combinando Analytics + Chatbot
  const processedData = useMemo(() => {
    if (!categoryTotalsQuery.data) {
      return [];
    }

    // Convertir datos de Analytics al formato CategoryGrid
    return categoryTotalsQuery.data.data.items.map((category) => {
      // Buscar datos correspondientes del chatbot usando el hook correcto
      const chatbotCategory = chatbotCategoryTotals.categories.find(
        (c) => c.id === category.id
      );

      // Calcular totales combinados (GA4 + Chatbot)
      const totalCurrent =
        category.total + (chatbotCategory?.currentValue || 0);
      const totalPrevious =
        category.previousTotal + (chatbotCategory?.previousValue || 0);

      // Calcular delta combinado usando artifact system
      const deltaArtifact = computeDeltaArtifact(totalCurrent, totalPrevious);

      return {
        categoryId: category.id,
        ga4Value: category.total,
        ga4PrevValue: category.previousTotal,
        chatbotValue: chatbotCategory?.currentValue || 0,
        chatbotPrevValue: chatbotCategory?.previousValue || 0,
        deltaArtifact, // Artifact completo con delta, deltaPct, artifact
        delta: deltaArtifact.deltaPct, // Mantener compatibilidad con deltaPct
      };
    });
  }, [categoryTotalsQuery.data, chatbotCategoryTotals.categories]);

  return {
    categoriesData: processedData,
    rawQuery: categoryTotalsQuery.data,
    chatbotCategories: chatbotCategoryTotals.categories, // Datos correctos del chatbot
    isLoading: categoryTotalsQuery.isLoading || chatbotCategoryTotals.isLoading,
    error: categoryTotalsQuery.error || chatbotCategoryTotals.error,
    refetch: () => {
      categoryTotalsQuery.refetch();
      chatbotCategoryTotals.refetch();
    },
  };
}
