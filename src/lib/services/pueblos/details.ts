/**
 * /lib/services/pueblos/details.ts
 * Service para obtener detalles de pueblos (series + donut) desde GA4
 */

import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

/** Estructura de una serie temporal */
export type SeriesData = {
  current: Array<{ label: string; value: number }>;
  previous: Array<{ label: string; value: number }>;
};

/** Estructura de datos del donut */
export type DonutData = Array<{ label: string; value: number }>;

/** Respuesta del endpoint de detalles de pueblos */
export type PuebloDetailsResponse = {
  granularity: Granularity;
  actualGranularity: Granularity; // Nueva granularidad efectiva usada
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: TownId;
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
export type PuebloDetailsParams = {
  townId: TownId;
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

/** URL base del endpoint */
const ENDPOINT_BASE_URL = "/api/analytics/v1/dimensions/pueblos/details";

/**
 * Obtiene detalles de un pueblo específico desde GA4
 */
export async function fetchPuebloDetails(
  params: PuebloDetailsParams
): Promise<PuebloDetailsResponse> {
  const { townId, granularity = "d", startDate, endDate } = params;

  // Construir URL con parámetros
  const searchParams = new URLSearchParams();

  if (granularity) {
    searchParams.set("granularity", granularity);
  }

  if (startDate) {
    searchParams.set("startDate", startDate);
  }

  if (endDate) {
    searchParams.set("endDate", endDate);
  }

  const url = `${ENDPOINT_BASE_URL}/${townId}?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch pueblo details: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: PuebloDetailsResponse = await response.json();
  return data;
}
