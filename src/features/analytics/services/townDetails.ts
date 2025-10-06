"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type TownDetailsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: TownId;
  title: string;
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  donutData: DonutDatum[];
  urlsTop?: Array<{
    url: string;
    path: string;
    events: number;
    views: number;
    subCategory?: string;
  }>;
  deltaPct?: number;
};

export async function getTownDetails(params: {
  townId: TownId;
  granularity: Granularity;
  /** si usas modo rango (DatePicker) pásalos; si no, omítelos y el backend hará preset */
  startISO?: string;
  endISO?: string;
  categoryId?: CategoryId; // (para futuros filtros)
  signal?: AbortSignal;
}): Promise<TownDetailsResponse> {
  const { townId, granularity, startISO, endISO, categoryId, signal } = params;
  const qs = buildQS({
    g: granularity,
    ...(startISO && endISO
      ? { start: startISO, end: endISO }
      : endISO
      ? { end: endISO }
      : null),
    ...(categoryId ? { categoryId } : null),
  });
  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/details?${qs}`;
  return fetchJSON<TownDetailsResponse>(url, { signal, method: "GET" });
}
