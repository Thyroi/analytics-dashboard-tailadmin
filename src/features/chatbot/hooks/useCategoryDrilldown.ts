/**
 * Hook para manejar el drilldown de categorías del chatbot
 * Conecta el clic en DeltaCard con datos de subcategorías/pueblos
 */

"use client";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { DonutDatum } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTagAudit } from "../services/tagAudit";
import type { Granularity } from "../types";

export type CategoryDrilldownData = {
  categoryId: CategoryId;
  categoryLabel: string;
  subcategories: string[];
  groupedSeries: GroupedBarSeries[];
  donutData: DonutDatum[];
  totalInteractions: number;
  isLoading: boolean;
  error: Error | null;
};

export type UseCategoryDrilldownOptions = {
  categoryId: CategoryId;
  granularity: Granularity;
  enabled?: boolean;
};

/**
 * Simula datos de subcategorías para el drilldown
 * En producción esto vendría del API real
 */
function generateMockDrilldownData(categoryId: CategoryId): {
  subcategories: string[];
  groupedSeries: GroupedBarSeries[];
  donutData: DonutDatum[];
} {
  const subcategoriesMap: Record<CategoryId, string[]> = {
    naturaleza: [
      "Flora",
      "Fauna",
      "Parques",
      "Reservas",
      "Senderos",
      "Miradores",
    ],
    fiestasTradiciones: [
      "Romerías",
      "Semana Santa",
      "Carnavales",
      "Ferias",
      "Danzas",
      "Música",
    ],
    playas: [
      "Urbanas",
      "Vírgenes",
      "Deportes",
      "Chiringuitos",
      "Bandera Azul",
      "Accesos",
    ],
    espaciosMuseisticos: [
      "Historia",
      "Arte",
      "Ciencia",
      "Etnografía",
      "Arqueología",
      "Casa Colón",
    ],
    patrimonio: [
      "Monumentos",
      "Arquitectura",
      "Yacimientos",
      "Iglesias",
      "Castillos",
      "Molinos",
    ],
    rutasCulturales: [
      "Colombina",
      "Vino",
      "Tinto de Verano",
      "Flamenco",
      "Minería",
      "Industrial",
    ],
    rutasSenderismo: [
      "Sendero Litoral",
      "GR-48",
      "Sierra",
      "Marismas",
      "PR-A",
      "Cicloturismo",
    ],
    sabor: ["Mariscos", "Jamón", "Vinos", "Fresas", "Pescaíto", "Repostería"],
    donana: [
      "Biodiversidad",
      "Rutas",
      "Centro Visitantes",
      "Observatorios",
      "Marismas",
      "Dunas",
    ],
    circuitoMonteblanco: [
      "Molinos",
      "Miradores",
      "Senderos",
      "Gastronomía",
      "Artesanía",
      "Historia",
    ],
    laRabida: [
      "Monasterio",
      "Muelle Carabelas",
      "Casa Martín Alonso",
      "Puerto",
      "Museo Naval",
      "Jardines",
    ],
    lugaresColombinos: [
      "Palos Frontera",
      "Moguer",
      "Huelva",
      "Mazagón",
      "Muelle",
      "Monumentos",
    ],
    otros: [
      "General",
      "Información",
      "Contacto",
      "Horarios",
      "Precios",
      "Varios",
    ],
  };

  const colorsMap: Record<CategoryId, string[]> = {
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

  const subcategories = subcategoriesMap[categoryId] || ["Sin datos"];
  const colors = colorsMap[categoryId] || ["#6B7280"];

  // Generar datos mock realistas
  const generateSeriesData = (base: number, variance: number) =>
    subcategories.map(() => Math.floor(base + Math.random() * variance));

  const groupedSeries: GroupedBarSeries[] = [
    {
      name: "Consultas",
      data: generateSeriesData(40, 30),
      color: colors[0],
    },
    {
      name: "Respuestas",
      data: generateSeriesData(35, 25),
      color: colors[1],
    },
    {
      name: "Satisfacción",
      data: generateSeriesData(30, 20),
      color: colors[2],
    },
  ];

  const donutData: DonutDatum[] = subcategories.map((sub, index) => ({
    label: sub,
    value: Math.floor(80 + Math.random() * 120), // 80-200 interacciones
    color: colors[index % colors.length],
  }));

  return {
    subcategories,
    groupedSeries,
    donutData,
  };
}

export function useCategoryDrilldown({
  categoryId,
  granularity,
  enabled = true,
}: UseCategoryDrilldownOptions): CategoryDrilldownData {
  // Query para obtener datos reales del API (si están disponibles)
  const { isLoading, error } = useQuery({
    queryKey: ["categoryDrilldown", categoryId, granularity],
    queryFn: () =>
      fetchTagAudit({
        granularity,
        patterns: `root.${categoryId}.*`, // Filtrar por categoría específica
      }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;

  const drilldownData = useMemo(() => {
    // Por ahora usar datos mock, pero se puede integrar con apiData
    const mockData = generateMockDrilldownData(categoryId);

    // Calcular total de interacciones
    const totalInteractions = mockData.donutData.reduce(
      (sum, item) => sum + item.value,
      0
    );

    return {
      ...mockData,
      totalInteractions,
    };
  }, [categoryId]);

  return {
    categoryId,
    categoryLabel,
    subcategories: drilldownData.subcategories,
    groupedSeries: drilldownData.groupedSeries,
    donutData: drilldownData.donutData,
    totalInteractions: drilldownData.totalInteractions,
    isLoading,
    error: error as Error | null,
  };
}

export default useCategoryDrilldown;
