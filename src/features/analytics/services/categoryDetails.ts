"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type CategoryDetailsResponse = {
  granularity: Granularity;
  actualGranularity?: Granularity; // Nueva granularidad efectiva usada (opcional para compatibilidad)
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: CategoryId;
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

export async function getCategoryDetails(params: {
  categoryId: CategoryId;
  granularity: Granularity;

  /** Si usas modo rango (DatePicker) pásalos; si no, omítelos y el backend aplicará presets. */
  startISO?: string;
  endISO?: string;

  /** Filtro opcional por municipio (nivel 2). */
  townId?: TownId;

  /** Flags opcionales (serán sobre-escritos por la granularidad cuando aplique). */
  seriesExpandDay?: boolean;
  donutCurrentDayOnly?: boolean;

  signal?: AbortSignal;
}): Promise<CategoryDetailsResponse> {
  const { categoryId, granularity, startISO, endISO, townId, signal } = params;

  // Regla global:
  // - g==='d'  -> seriesExpandDay=1 (línea 7d), donutCurrentDayOnly=1 (donut 1d)
  // - g!=='d'  -> ambos = 0 (comportamiento normal)
  const isDay = granularity === "d";
  const finalSeriesExpandDay = isDay ? true : false;
  const finalDonutCurrentDayOnly = isDay ? true : false;

  // (Si en algún caso requieres permitir override manual, podrías OR con los params)
  // const finalSeriesExpandDay = isDay || Boolean(seriesExpandDay);
  // const finalDonutCurrentDayOnly = isDay || Boolean(donutCurrentDayOnly);

  const qs = buildQS({
    g: granularity,
    ...(startISO && endISO
      ? { start: startISO, end: endISO }
      : endISO
      ? { end: endISO }
      : null),
    ...(townId ? { townId } : null),
    // flags forzados por granularidad
    seriesExpandDay: finalSeriesExpandDay ? "1" : "0",
    donutCurrentDayOnly: finalDonutCurrentDayOnly ? "1" : "0",
  });

  const url = `/api/analytics/v1/dimensions/categorias/${categoryId}/details?${qs}`;
  return fetchJSON<CategoryDetailsResponse>(url, { signal, method: "GET" });
}
