/**
 * /lib/services/categorias/details.ts
 * Service para obtener detalles de categorías (series + donut) desde GA4
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

/** Estructura de una serie temporal */
export type SeriesData = {
  current: Array<{ label: string; value: number }>;
  previous: Array<{ label: string; value: number }>;
};

/** Estructura de datos del donut */
export type DonutData = Array<{ label: string; value: number }>;

/** Respuesta del endpoint de detalles de categorías */
export type CategoriaDetailsResponse = {
  success: boolean;
  calculation: {
    requestedGranularity: Granularity;
    finalGranularity: Granularity;
    granularityReason: string;
    currentPeriod: { start: string; end: string };
    previousPeriod: { start: string; end: string };
  };
  data: {
    property: string;
    id: CategoryId;
    title: string;
    series: SeriesData;
    donutData: DonutData;
    deltaPct: number | null;
    totals: {
      current: number;
      previous: number;
    };
    debug?: {
      totalRows: number;
      filteredRows: number;
      townFilter: string | null;
      matchedRows: number;
      xLabelsCount: number;
    };
  };
};

/** Parámetros para el servicio de detalles */
export type CategoriaDetailsParams = {
  categoryId: CategoryId;
  granularity?: Granularity; // Opcional, se calcula automáticamente
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  townId?: string; // Para drilldown
};

/** URL base del endpoint */
const ENDPOINT_BASE_URL = "/api/analytics/v1/dimensions/categorias/details";

/**
 * Obtiene detalles de una categoría específica desde GA4
 */
export async function fetchCategoriaDetails(
  params: CategoriaDetailsParams
): Promise<CategoriaDetailsResponse> {
  const { categoryId, granularity, startDate, endDate, townId } = params;

  // Construir URL con parámetros nuevos
  const searchParams = new URLSearchParams();

  searchParams.set("startDate", startDate);
  searchParams.set("endDate", endDate);

  if (granularity) {
    searchParams.set("granularity", granularity);
  }

  if (townId) {
    searchParams.set("townId", townId);
  }

  const url = `${ENDPOINT_BASE_URL}/${categoryId}?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch categoria details: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: CategoriaDetailsResponse = await response.json();

  return data;
}
