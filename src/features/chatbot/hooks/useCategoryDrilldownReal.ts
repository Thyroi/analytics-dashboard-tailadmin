/**
 * Hook para obtener drilldown de categorías del chatbot
 * Usa React Query para manejo de estado y cache
 * Compatible con range picker y contexto de tiempo
 *
 * POLÍTICA DE TIEMPO:
 * - Usa computeRangesForSeries de timeWindows.ts (comportamiento Series estándar)
 * - Granularidad "d" = 7 días para series (NO 1 día)
 * - Previous = ventana contigua del mismo tamaño
 * - Respeta rangos custom del usuario (startDate/endDate)
 */

import {
  fetchCategoryTownBreakdown,
  type CategoryTownBreakdownResponse,
} from "@/lib/services/chatbot/categoryTownBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Re-exportar tipos legacy para compatibilidad
export type CategoryDrilldownParams = {
  categoryId: CategoryId;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
};

export type SubcategoryData = {
  label: string;
  totalValue: number;
  timeSeriesData: Array<{ time: string; value: number }>;
};

/** Opciones del hook */
export type UseCategoryDrilldownOptions = {
  categoryId: CategoryId;
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
  refetchInterval?: number;
  db?: string;
};

/** Estados del hook */
type LoadingState = {
  status: "loading";
  data: null;
  subcategories: SubcategoryData[];
  lineSeriesData: SeriesPoint[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: true;
  isError: false;
  error: null;
};

type ReadyState = {
  status: "ready";
  data: CategoryTownBreakdownResponse;
  subcategories: SubcategoryData[];
  lineSeriesData: SeriesPoint[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: false;
  isError: false;
  error: null;
};

type ErrorState = {
  status: "error";
  data: null;
  subcategories: SubcategoryData[];
  lineSeriesData: SeriesPoint[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: false;
  isError: true;
  error: Error;
};

type CategoryDrilldownState = LoadingState | ReadyState | ErrorState;

/** Datos vacíos por defecto */
const EMPTY_SUBCATEGORIES: SubcategoryData[] = [];
const EMPTY_LINE_SERIES: SeriesPoint[] = [];
const EMPTY_DONUT_DATA: DonutDatum[] = [];

/**
 * Hook principal para obtener drilldown de categoría
 */
export function useCategoryDrilldown(
  options: UseCategoryDrilldownOptions,
): CategoryDrilldownState {
  const {
    categoryId,
    granularity = "d",
    startDate,
    endDate,
    enabled = true,
    refetchInterval,
  } = options;

  // Query para obtener datos del chatbot usando fetchChatbotTotals (igual que useCategoryDetails)
  const chatbotQuery = useQuery<CategoryTownBreakdownResponse>({
    queryKey: [
      "chatbot",
      "category",
      "drilldown",
      categoryId,
      granularity,
      startDate,
      endDate,
    ],
    queryFn: () =>
      fetchCategoryTownBreakdown({
        categoryId,
        startISO: startDate ?? null,
        endISO: endDate ?? null,
        windowGranularity: granularity,
      }),
    enabled: enabled && !!categoryId,
    refetchInterval,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Procesar datos del chatbot usando buildSeriesAndDonutFocused (misma lógica que useCategoryDetails)
  const processedData = useMemo(() => {
    if (!chatbotQuery.data || !categoryId) {
      return {
        subcategories: EMPTY_SUBCATEGORIES,
        lineSeriesData: EMPTY_LINE_SERIES,
        donutData: EMPTY_DONUT_DATA,
        totalInteractions: 0,
      };
    }

    try {
      const result = chatbotQuery.data;
      const donutData = result.towns
        .filter((item) => item.currentTotal > 0)
        .map((item) => ({ label: item.label, value: item.currentTotal }));

      const subcategories: SubcategoryData[] = result.towns.map((item) => ({
        label: item.label,
        totalValue: item.currentTotal,
        timeSeriesData: [],
      }));

      const lineSeriesData = result.series?.current ?? [];
      const totalInteractions = result.towns.reduce(
        (sum, item) => sum + item.currentTotal,
        0,
      );

      return {
        subcategories,
        lineSeriesData,
        donutData,
        totalInteractions,
      };
    } catch {
      return {
        subcategories: EMPTY_SUBCATEGORIES,
        lineSeriesData: EMPTY_LINE_SERIES,
        donutData: EMPTY_DONUT_DATA,
        totalInteractions: 0,
      };
    }
  }, [chatbotQuery.data, categoryId]);

  // Estados basados en la query del chatbot
  if (chatbotQuery.isLoading) {
    return {
      status: "loading",
      data: null,
      subcategories: EMPTY_SUBCATEGORIES,
      lineSeriesData: EMPTY_LINE_SERIES,
      donutData: EMPTY_DONUT_DATA,
      totalInteractions: 0,
      isLoading: true,
      isError: false,
      error: null,
    };
  }

  if (chatbotQuery.isError) {
    return {
      status: "error",
      data: null,
      subcategories: EMPTY_SUBCATEGORIES,
      lineSeriesData: EMPTY_LINE_SERIES,
      donutData: EMPTY_DONUT_DATA,
      totalInteractions: 0,
      isLoading: false,
      isError: true,
      error: chatbotQuery.error as Error,
    };
  }

  if (chatbotQuery.data) {
    return {
      status: "ready",
      data: chatbotQuery.data,
      subcategories: processedData.subcategories,
      lineSeriesData: processedData.lineSeriesData,
      donutData: processedData.donutData,
      totalInteractions: processedData.totalInteractions,
      isLoading: false,
      isError: false,
      error: null,
    };
  }

  // Fallback
  return {
    status: "loading",
    data: null,
    subcategories: EMPTY_SUBCATEGORIES,
    lineSeriesData: EMPTY_LINE_SERIES,
    donutData: EMPTY_DONUT_DATA,
    totalInteractions: 0,
    isLoading: true,
    isError: false,
    error: null,
  };
}

/**
 * Hook legacy para compatibilidad con interfaz existente
 */
export function useChatbotCategoryDrilldown(
  categoryId: CategoryId,
  granularity: Granularity,
  endDate?: string,
  startDate?: string,
): {
  subcategories: SubcategoryData[];
  lineSeriesData: SeriesPoint[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const drilldownState = useCategoryDrilldown({
    categoryId,
    granularity,
    startDate,
    endDate,
  });

  return {
    subcategories: drilldownState.subcategories,
    lineSeriesData: drilldownState.lineSeriesData,
    donutData: drilldownState.donutData,
    totalInteractions: drilldownState.totalInteractions,
    isLoading: drilldownState.isLoading,
    isError: drilldownState.isError,
    error: drilldownState.error,
  };
}
