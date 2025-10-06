"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

/** Serie multitrayecto por URL para la vista comparativa */
export type UrlSeries = {
  name: string;
  data: number[];
  path: string;
};

/** ---------- Town ---------- */
export type TownDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  context: { townId: TownId; categoryId?: CategoryId };
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  xLabels: string[];
  donut: DonutDatum[];
  deltaPct: number;
  seriesByUrl: UrlSeries[];
};

export type TownDrilldownArgs = {
  townId: TownId;
  granularity: Granularity;
  endISO?: string;
  categoryId?: CategoryId | null;
  dayAsWeek?: boolean; // 👈 NUEVO
};

export async function getTownDrilldown({
  townId,
  granularity,
  endISO,
  categoryId,
  dayAsWeek,
}: TownDrilldownArgs): Promise<TownDrilldownResponse> {
  const qs = new URLSearchParams({ g: granularity });
  if (endISO) qs.set("end", endISO);
  if (categoryId) qs.set("categoryId", categoryId);
  if (granularity === "d" && dayAsWeek) qs.set("dw", "1"); // 👈

  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/drilldown?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  return (await resp.json()) as TownDrilldownResponse;
}

/** ---------- Category (ya existente) ---------- */
export type CategoryDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  context: { categoryId: CategoryId; townId?: TownId };
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  xLabels: string[];
  donut: DonutDatum[];
  deltaPct: number;
  seriesByUrl: UrlSeries[];
};

export type CategoryDrilldownArgs = {
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
  townId?: TownId | null;
};

export async function getCategoryDrilldown({
  categoryId,
  granularity,
  endISO,
  townId,
}: CategoryDrilldownArgs): Promise<CategoryDrilldownResponse> {
  const qs = new URLSearchParams({ g: granularity, categoryId });
  if (endISO) qs.set("end", endISO);
  if (townId) qs.set("townId", townId);
  if (granularity === "d") qs.set("dw", "1"); // comportamiento alineado en vistas con gráficas

  const url = `/api/analytics/v1/dimensions/categorias/drilldown?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  return (await resp.json()) as CategoryDrilldownResponse;
}
