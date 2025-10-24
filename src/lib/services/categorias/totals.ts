/**
 * /lib/services/categorias/totals.ts
 * Service para obtener totales de categorías desde GA4
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

/** Respuesta del endpoint de totales de categorías */
export type CategoriesTotalsResponse = {
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
    items: Array<{
      id: CategoryId;
      title: string;
      total: number;
      previousTotal: number;
      deltaPct: number | null;
    }>;
  };
};

/** Parámetros para el servicio de totales */
export type CategoriesTotalsParams = {
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

/** URL del endpoint */
const ENDPOINT_URL = "/api/analytics/v1/dimensions/categorias/totales";

/**
 * Obtiene totales de categorías desde GA4 con nueva lógica de rangos
 */
export async function fetchCategoriesTotals(
  params: CategoriesTotalsParams = {}
): Promise<CategoriesTotalsResponse> {
  const { granularity, startDate, endDate } = params;

  // Validar que tenemos las fechas requeridas
  if (!startDate || !endDate) {
    throw new Error("Both startDate and endDate are required");
  }

  // Construir URL con parámetros
  const searchParams = new URLSearchParams();

  searchParams.set("startDate", startDate);
  searchParams.set("endDate", endDate);

  // Granularidad es opcional - si no se pasa, se calcula automáticamente
  if (granularity) {
    searchParams.set("granularity", granularity);
  }

  const url = `${ENDPOINT_URL}?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Obtiene solo los datos del período actual (sin comparación)
 */
export async function fetchCategoriesTotalsCurrent(
  params: CategoriesTotalsParams = {}
): Promise<Array<{ id: CategoryId; title: string; total: number }>> {
  const data = await fetchCategoriesTotals(params);

  return data.data.items.map((item) => ({
    id: item.id,
    title: item.title,
    total: item.total,
  }));
}

/**
 * Obtiene solo las categorías con datos (total > 0)
 */
export async function fetchCategoriesTotalsWithData(
  params: CategoriesTotalsParams = {}
): Promise<CategoriesTotalsResponse["data"]["items"]> {
  const data = await fetchCategoriesTotals(params);

  return data.data.items.filter((item) => item.total > 0);
}
