"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type TownDetailsResponse = {
  granularity: Granularity;
  actualGranularity?: Granularity; // Nueva granularidad efectiva usada (opcional para compatibilidad)
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: TownId;
  title: string;
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  xLabels?: string[];
  donutData: DonutDatum[]; // estándar nuevo
  deltaPct?: number;
  seriesByUrl?: { name: string; data: number[]; path: string }[];
};

// Compat opcional (si backend aún trae "donut" en algún entorno)
export type TownDetailsResponseLegacy = TownDetailsResponse & {
  donut?: DonutDatum[];
};

export async function getTownDetails(params: {
  townId: TownId;
  granularity: Granularity;
  endISO?: string;
  startISO?: string;
  categoryId?: CategoryId; // ⬅️ necesario para nivel 2
  signal?: AbortSignal;
}): Promise<TownDetailsResponse> {
  const { townId, granularity, endISO, startISO, categoryId, signal } = params;

  const qs = buildQS({
    g: granularity,
    ...(startISO && endISO
      ? { start: startISO, end: endISO }
      : endISO
      ? { end: endISO }
      : null),
    ...(categoryId ? { categoryId } : null), // ⬅️ AÑADIDO
  });

  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/details?${qs}`;
  return fetchJSON<TownDetailsResponse>(url, { signal, method: "GET" });
}
