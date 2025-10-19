/**
 * /lib/services/categorias/totals.ts
 * Service para obtener totales de categorías desde GA4
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

/** Respuesta del endpoint de totales de categorías */
export type CategoriesTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: Array<{
    id: CategoryId;
    title: string;
    total: number;
    previousTotal: number; // ✨ NUEVO: valor del período anterior
    deltaPct: number | null;
  }>;
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
 * Obtiene totales de categorías desde GA4
 */
export async function fetchCategoriesTotals(
  params: CategoriesTotalsParams = {}
): Promise<CategoriesTotalsResponse> {
  const { granularity = "d", startDate, endDate } = params;

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

  return data.items.map((item) => ({
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
): Promise<CategoriesTotalsResponse["items"]> {
  const data = await fetchCategoriesTotals(params);

  return data.items.filter((item) => item.total > 0);
}
