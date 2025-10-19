/**
 * /lib/services/pueblos/totals.ts
 * Service para obtener totales de pueblos desde GA4
 */

import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

/** Respuesta del endpoint de totales de pueblos */
export type PueblosTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: Array<{
    id: TownId;
    title: string;
    total: number;
    previousTotal: number; // ✨ NUEVO: valor del período anterior
    deltaPct: number | null;
  }>;
};

/** Parámetros para el servicio de totales */
export type PueblosTotalsParams = {
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

const ENDPOINT_URL = "/api/analytics/v1/dimensions/pueblos/totales";

/**
 * Fetch totales de pueblos desde el endpoint
 */
export async function fetchPueblosTotals(
  params: PueblosTotalsParams = {}
): Promise<PueblosTotalsResponse> {
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
    throw new Error(`Failed to fetch pueblos totals: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch totales solo con endDate (granularidad preset)
 */
export async function fetchPueblosTotalsCurrent(
  granularity: Granularity = "d",
  endDate?: string | null
): Promise<PueblosTotalsResponse> {
  return fetchPueblosTotals({
    granularity,
    endDate,
  });
}

/**
 * Fetch totales con rango personalizado
 */
export async function fetchPueblosTotalsWithData(
  granularity: Granularity = "d",
  startDate: string,
  endDate: string
): Promise<PueblosTotalsResponse> {
  return fetchPueblosTotals({
    granularity,
    startDate,
    endDate,
  });
}
