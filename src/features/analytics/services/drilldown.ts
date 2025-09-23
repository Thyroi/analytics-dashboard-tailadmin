"use client";

import type { Granularity, DonutDatum, SeriesPoint } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";
import type { CategoryId } from "@/lib/taxonomy/categories";

/** Serie multitrayecto por URL para la vista comparativa */
export type UrlSeries = {
  /** Nombre que se pinta en la leyenda (usamos la URL/path) */
  name: string;
  /** Valores alineados con xLabels (del rango “current”) */
  data: number[];
  /** Path absoluto de la URL representada (útil para navegar) */
  path: string;
};

/** ---------- Town (ya existente) ---------- */
export type TownDrilldownResponse = {
  granularity: Granularity;
  range: { current: { start: string; end: string }; previous: { start: string; end: string } };
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
};

export async function getTownDrilldown({
  townId,
  granularity,
  endISO,
  categoryId,
}: TownDrilldownArgs): Promise<TownDrilldownResponse> {
  const qs = new URLSearchParams({ g: granularity });
  if (endISO) qs.set("end", endISO);
  if (categoryId) qs.set("categoryId", categoryId);

  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/drilldown?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as TownDrilldownResponse;
  return json;
}

/** ---------- Category (nuevo) ---------- */
export type CategoryDrilldownResponse = {
  granularity: Granularity;
  range: { current: { start: string; end: string }; previous: { start: string; end: string } };
  /**
   * Contexto:
   *  - categoryId: categoría raíz seleccionada
   *  - townId?: si se filtra dentro de un municipio concreto (nivel 2)
   */
  context: { categoryId: CategoryId; townId?: TownId };
  /** Serie total (actual vs. comparable) de la categoría (agregada o filtrada por townId si se pasa) */
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  /** Etiquetas X para el rango actual (coinciden con series.current) */
  xLabels: string[];
  /**
   * Donut:
   *  - si NO se pasa townId → totales por municipio
   *  - si SÍ se pasa townId → totales por sub-actividad (slugs) dentro de esa categoría y pueblo
   */
  donut: DonutDatum[];
  /** Δ% entre total actual y anterior de la categoría */
  deltaPct: number;
  /**
   * Solo cuando hay townId: series por URL (cada una alineada a xLabels).
   * Si no hay townId, vendrá vacío.
   */
  seriesByUrl: UrlSeries[];
};

export type CategoryDrilldownArgs = {
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
  /** Opcional: para entrar al nivel categoría → pueblo → sub-actividades */
  townId?: TownId | null;
};

/** Llama al endpoint de drilldown por categoría. */
export async function getCategoryDrilldown({
  categoryId,
  granularity,
  endISO,
  townId,
}: CategoryDrilldownArgs): Promise<CategoryDrilldownResponse> {
  const qs = new URLSearchParams({ g: granularity, categoryId });
  if (endISO) qs.set("end", endISO);
  if (townId) qs.set("townId", townId);

  const url = `/api/analytics/v1/dimensions/categorias/drilldown?${qs.toString()}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const json = (await resp.json()) as CategoryDrilldownResponse;
  return json;
}
