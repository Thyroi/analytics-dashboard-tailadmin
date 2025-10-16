/**
 * Hook para obtener drilldown de categorías del chatbot
 * Usa React Query para manejo de estado y cache
 * Compatible con range picker y contexto de tiempo
 */

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import {
  fetchCategoryDrilldown,
  validateCategoryDrilldownParams,
  type CategoryDrilldownParams,
  type CategoryDrilldownResponse,
  type SubcategoryData,
} from "@/lib/services/chatbot/categoryDrilldown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
  groupedSeries: GroupedBarSeries[];
  groupedCategories: string[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: true;
  isError: false;
  error: null;
};

type ReadyState = {
  status: "ready";
  data: CategoryDrilldownResponse;
  subcategories: SubcategoryData[];
  groupedSeries: GroupedBarSeries[];
  groupedCategories: string[];
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
  groupedSeries: GroupedBarSeries[];
  groupedCategories: string[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: false;
  isError: true;
  error: Error;
};

type CategoryDrilldownState = LoadingState | ReadyState | ErrorState;

/** Datos vacíos por defecto */
const EMPTY_SUBCATEGORIES: SubcategoryData[] = [];
const EMPTY_GROUPED_SERIES: GroupedBarSeries[] = [];
const EMPTY_GROUPED_CATEGORIES: string[] = [];
const EMPTY_DONUT_DATA: DonutDatum[] = [];

/**
 * Genera colores para subcategorías basándose en la categoría padre
 */
function generateSubcategoryColors(categoryId: CategoryId): string[] {
  const colorPalettes: Record<CategoryId, string[]> = {
    naturaleza: [
      "#10B981",
      "#34D399",
      "#6EE7B7",
      "#A7F3D0",
      "#D1FAE5",
      "#ECFDF5",
    ],
    fiestasTradiciones: [
      "#EC4899",
      "#F472B6",
      "#FB7DC3",
      "#FDBA8C",
      "#FED7AA",
      "#FEF3C7",
    ],
    playas: ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE", "#EFF6FF"],
    espaciosMuseisticos: [
      "#8B5CF6",
      "#A78BFA",
      "#C4B5FD",
      "#DDD6FE",
      "#EDE9FE",
      "#F5F3FF",
    ],
    patrimonio: [
      "#EF4444",
      "#F87171",
      "#FCA5A5",
      "#FECACA",
      "#FEE2E2",
      "#FEF2F2",
    ],
    rutasCulturales: [
      "#F59E0B",
      "#FBBF24",
      "#FCD34D",
      "#FDE68A",
      "#FEF3C7",
      "#FFFBEB",
    ],
    rutasSenderismo: [
      "#059669",
      "#10B981",
      "#34D399",
      "#6EE7B7",
      "#A7F3D0",
      "#D1FAE5",
    ],
    sabor: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FECACA", "#FEE2E2"],
    donana: ["#0D9488", "#14B8A6", "#5EEAD4", "#99F6E4", "#CCFBF1", "#F0FDFA"],
    circuitoMonteblanco: [
      "#7C2D12",
      "#B45309",
      "#F59E0B",
      "#FBBF24",
      "#FCD34D",
      "#FDE68A",
    ],
    laRabida: [
      "#1E40AF",
      "#3B82F6",
      "#60A5FA",
      "#93C5FD",
      "#BFDBFE",
      "#DBEAFE",
    ],
    lugaresColombinos: [
      "#7C3AED",
      "#8B5CF6",
      "#A78BFA",
      "#C4B5FD",
      "#DDD6FE",
      "#EDE9FE",
    ],
    otros: ["#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6", "#F9FAFB"],
  };

  return colorPalettes[categoryId] || colorPalettes.otros;
}

/**
 * Convierte fecha YYYYMMDD a YYYY-MM-DD para mostrar
 */
function formatDateForDisplay(dateString: string): string {
  if (dateString.length !== 8) return dateString;
  return `${dateString.slice(0, 4)}-${dateString.slice(
    4,
    6
  )}-${dateString.slice(6, 8)}`;
}

/**
 * Procesa datos raw en series para GroupedBarChart basado en fechas reales
 */
function processGroupedBarSeries(
  subcategories: SubcategoryData[],
  categoryId: CategoryId
): { series: GroupedBarSeries[]; categories: string[] } {
  if (subcategories.length === 0)
    return { series: EMPTY_GROUPED_SERIES, categories: [] };

  const colors = generateSubcategoryColors(categoryId);

  // 1. Recopilar todas las fechas únicas de todas las subcategorías
  const allDatesSet = new Set<string>();
  subcategories.forEach((sub) => {
    sub.timeSeriesData.forEach((point) => {
      allDatesSet.add(point.time);
    });
  });

  // 2. Ordenar fechas y convertir a formato display
  const sortedDates = Array.from(allDatesSet).sort();
  const displayDates = sortedDates.map(formatDateForDisplay);

  // 3. Crear una serie por cada subcategoría
  const series: GroupedBarSeries[] = subcategories.map((sub, index) => {
    // Crear array de valores para cada fecha (0 si no hay dato)
    const dataPoints = sortedDates.map((date) => {
      const point = sub.timeSeriesData.find((p) => p.time === date);
      return point ? point.value : 0;
    });

    return {
      name: sub.label,
      data: dataPoints,
      color: colors[index % colors.length],
    };
  });

  return {
    series,
    categories: displayDates,
  };
}

/**
 * Procesa subcategorías en datos para DonutChart
 */
function processDonutData(
  subcategories: SubcategoryData[],
  categoryId: CategoryId
): DonutDatum[] {
  if (subcategories.length === 0) return EMPTY_DONUT_DATA;

  const colors = generateSubcategoryColors(categoryId);

  return subcategories.map((sub, index) => ({
    label: sub.label,
    value: sub.totalValue,
    color: colors[index % colors.length],
  }));
}

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
    db = "project_huelva",
  } = options;

  const queryKey = [
    "category-drilldown",
    categoryId,
    granularity,
    startDate,
    endDate,
    db,
  ];

  const queryParams = useMemo(
    (): CategoryDrilldownParams => ({
      categoryId,
      granularity,
      startDate,
      endDate,
      db,
    }),
    [categoryId, granularity, startDate, endDate, db]
  );

  // Validar parámetros
  const validationError = useMemo(() => {
    return validateCategoryDrilldownParams(queryParams);
  }, [queryParams]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchCategoryDrilldown(queryParams),
    enabled: enabled && !!categoryId && !validationError,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Procesar datos para visualizaciones
  const processedData = useMemo(() => {
    if (!query.data) {
      return {
        subcategories: EMPTY_SUBCATEGORIES,
        groupedSeries: EMPTY_GROUPED_SERIES,
        groupedCategories: EMPTY_GROUPED_CATEGORIES,
        donutData: EMPTY_DONUT_DATA,
        totalInteractions: 0,
      };
    }

    const subcategories = query.data.subcategories;
    const groupedData = processGroupedBarSeries(subcategories, categoryId);
    const donutData = processDonutData(subcategories, categoryId);
    const totalInteractions = query.data.totalInteractions;

    return {
      subcategories,
      groupedSeries: groupedData.series,
      groupedCategories: groupedData.categories,
      donutData,
      totalInteractions,
    };
  }, [query.data, categoryId]);

  if (validationError) {
    return {
      status: "error",
      data: null,
      subcategories: EMPTY_SUBCATEGORIES,
      groupedSeries: EMPTY_GROUPED_SERIES,
      groupedCategories: EMPTY_GROUPED_CATEGORIES,
      donutData: EMPTY_DONUT_DATA,
      totalInteractions: 0,
      isLoading: false,
      isError: true,
      error: new Error(`Validation error: ${validationError}`),
    };
  }

  if (query.isLoading) {
    return {
      status: "loading",
      data: null,
      subcategories: EMPTY_SUBCATEGORIES,
      groupedSeries: EMPTY_GROUPED_SERIES,
      groupedCategories: EMPTY_GROUPED_CATEGORIES,
      donutData: EMPTY_DONUT_DATA,
      totalInteractions: 0,
      isLoading: true,
      isError: false,
      error: null,
    };
  }

  if (query.isError) {
    return {
      status: "error",
      data: null,
      subcategories: EMPTY_SUBCATEGORIES,
      groupedSeries: EMPTY_GROUPED_SERIES,
      groupedCategories: EMPTY_GROUPED_CATEGORIES,
      donutData: EMPTY_DONUT_DATA,
      totalInteractions: 0,
      isLoading: false,
      isError: true,
      error: query.error as Error,
    };
  }

  if (query.data) {
    return {
      status: "ready",
      data: query.data,
      subcategories: processedData.subcategories,
      groupedSeries: processedData.groupedSeries,
      groupedCategories: processedData.groupedCategories,
      donutData: processedData.donutData,
      totalInteractions: processedData.totalInteractions,
      isLoading: false,
      isError: false,
      error: null,
    };
  }

  // Fallback (no debería llegar aquí)
  return {
    status: "loading",
    data: null,
    subcategories: EMPTY_SUBCATEGORIES,
    groupedSeries: EMPTY_GROUPED_SERIES,
    groupedCategories: EMPTY_GROUPED_CATEGORIES,
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
  groupedSeries: GroupedBarSeries[];
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
    groupedSeries: drilldownState.groupedSeries,
    donutData: drilldownState.donutData,
    totalInteractions: drilldownState.totalInteractions,
    isLoading: drilldownState.isLoading,
    isError: drilldownState.isError,
    error: drilldownState.error,
  };
}
