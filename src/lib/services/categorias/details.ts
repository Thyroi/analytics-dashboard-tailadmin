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
  granularity: Granularity;
  actualGranularity: Granularity; // Nueva granularidad efectiva usada
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: CategoryId;
  title: string;
  series: SeriesData;
  donutData: DonutData;
  deltaPct: number | null;
  debug?: {
    totalRows: number;
    matchedRows: number;
    xLabelsCount: number;
    currentTotal: number;
    previousTotal: number;
  };
};

/** Parámetros para el servicio de detalles */
export type CategoriaDetailsParams = {
  categoryId: CategoryId;
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

/** URL base del endpoint */
const ENDPOINT_BASE_URL = "/api/analytics/v1/dimensions/categorias/details";

/**
 * Obtiene detalles de una categoría específica desde GA4
 */
export async function fetchCategoriaDetails(
  params: CategoriaDetailsParams
): Promise<CategoriaDetailsResponse> {
  const { categoryId, granularity = "d", startDate, endDate } = params;

  // Construir URL con parámetros
  const searchParams = new URLSearchParams();

  if (granularity) {
    searchParams.set("g", granularity);
  }

  if (startDate) {
    searchParams.set("start", startDate);
  }

  if (endDate) {
    searchParams.set("end", endDate);
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
