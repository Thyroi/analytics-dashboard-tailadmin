"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { Granularity, SeriesPoint, DonutDatum } from "@/lib/types";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";

export type CategoryDetailsResponse = {
  granularity: Granularity;
  range: { current: { start: string; end: string }, previous: { start: string; end: string } };
  property: string;
  id: CategoryId;
  title: string;
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  donutData: DonutDatum[];
  urlsTop?: Array<{ url: string; path: string; events: number; views: number; subCategory?: string }>;
  deltaPct?: number;
};

export async function getCategoryDetails(params: {
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
  /** cuando venga, el backend filtrará categoría+pueblo y la donut será sub-actividades */
  townId?: TownId;
  signal?: AbortSignal;
}): Promise<CategoryDetailsResponse> {
  const { categoryId, granularity, endISO, townId, signal } = params;
  const qs = buildQS({
    g: granularity,
    ...(endISO ? { end: endISO } : null),
    ...(townId ? { townId } : null),
  });
  const url = `/api/analytics/v1/dimensions/categorias/${categoryId}/details?${qs}`;
  return fetchJSON<CategoryDetailsResponse>(url, { signal, method: "GET" });
}
