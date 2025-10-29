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
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildSeriesAndDonutFocused } from "@/lib/utils/data";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
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
  data: ChatbotTotalsResponse;
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
  options: UseCategoryDrilldownOptions
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
  const chatbotQuery = useQuery<ChatbotTotalsResponse>({
    queryKey: ["chatbot", "totals", granularity, startDate, endDate],
    queryFn: () => {
      // Usar computeRangesForSeries de timeWindows.ts para consistencia
      // Esta función maneja correctamente el comportamiento de Series:
      // - Granularidad "d" = 7 días
      // - Previous = ventana contigua del mismo tamaño
      const ranges = computeRangesForSeries(granularity, startDate, endDate);

      return fetchChatbotTotals({
        granularity,
        startDate: ranges.previous.start,
        endDate: ranges.current.end,
      });
    },
    enabled: enabled && !!categoryId,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
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
      // Usar computeRangesForSeries de timeWindows.ts (comportamiento Series estándar)
      const ranges = computeRangesForSeries(granularity, startDate, endDate);

      // Usar buildSeriesAndDonutFocused para procesar los datos (igual que useCategoryDetails)
      const result = buildSeriesAndDonutFocused(
        {
          granularity,
          currentRange: ranges.current,
          prevRange: ranges.previous,
          focus: { type: "category", id: categoryId },
        },
        chatbotQuery.data
      );

      // Convertir a formato compatible con el componente de drilldown
      const subcategories: SubcategoryData[] = result.donutData.map((item) => ({
        label: item.label,
        totalValue: item.value,
        timeSeriesData: result.series.current
          .filter((point) => point.label.includes(item.label))
          .map((point) => ({
            time: point.label, // Usar label como time para compatibilidad
            value: point.value,
          })),
      }));

      // Usar directamente las series de línea que devuelve buildSeriesAndDonutFocused
      const lineSeriesData = result.series.current;
      const totalInteractions = result.donutData.reduce(
        (sum, item) => sum + item.value,
        0
      );

      return {
        subcategories,
        lineSeriesData,
        donutData: result.donutData,
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
  }, [chatbotQuery.data, categoryId, granularity, startDate, endDate]);

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
  startDate?: string
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
