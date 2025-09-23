"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { Granularity, SeriesPoint, DonutDatum } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";
import type { CategoryId } from "@/lib/taxonomy/categories";

export type TownDetailsResponse = {
  granularity: Granularity;
  range: { current: { start: string; end: string }, previous: { start: string; end: string } };
  property: string;
  id: TownId;
  title: string;
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  donutData: DonutDatum[];
  // ⇣ estos pueden no venir todavía (opcionales)
  urlsTop?: Array<{ url: string; path: string; events: number; views: number; subCategory?: string }>;
  deltaPct?: number;
};

export async function getTownDetails(params: {
  townId: TownId;
  granularity: Granularity;
  endISO?: string;
  /** cuando venga, el backend filtrará pueblo+categoría y la donut será sub-actividades */
  categoryId?: CategoryId;
  signal?: AbortSignal;
}): Promise<TownDetailsResponse> {
  const { townId, granularity, endISO, categoryId, signal } = params;
  const qs = buildQS({
    g: granularity,
    ...(endISO ? { end: endISO } : null),
    ...(categoryId ? { categoryId } : null),
  });
  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/details?${qs}`;
  return fetchJSON<TownDetailsResponse>(url, { signal, method: "GET" });
}
