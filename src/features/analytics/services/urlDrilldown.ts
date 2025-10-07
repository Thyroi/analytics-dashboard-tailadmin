"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

/** Rango simple YYYY-MM-DD */
export type DateRange = { start: string; end: string };

export type UrlDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: DateRange;
    previous: DateRange;
  };
  context: { path: string };

  /** Etiquetas del X (YYYY-MM-DD para d/w/m; YYYY-MM para y) */
  xLabels: string[];

  /** Serie de promedio de engagement por bucket (segundos) */
  seriesAvgEngagement: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };

  /** KPIs agregados para el path (nullable por seguridad) */
  kpis: {
    current: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      /** derivados */
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    previous: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      /** derivados */
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    /** deltas % respecto a previous */
    deltaPct: {
      activeUsers: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
  } | null;

  /** Donuts (policy backend: si g==='d' → último día; si no, todo current) */
  operatingSystems: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];

  /** delta % de la serie base (p.ej. vistas) current vs previous */
  deltaPct: number;
};

export async function getUrlDrilldown(params: {
  /** Puede ser URL completa o pathname; el backend normaliza */
  path: string;
  granularity: Granularity;
  /** Si se pasa, ancla la ventana para que termine en `endISO` (AYER relativo) */
  endISO?: string;
  signal?: AbortSignal;
}): Promise<UrlDrilldownResponse> {
  const { path, granularity, endISO, signal } = params;

  const qs = buildQS({
    path,
    g: granularity,
    ...(endISO ? { end: endISO } : null),
  });

  const url = `/api/analytics/v1/drilldown/url?${qs}`;
  return fetchJSON<UrlDrilldownResponse>(url, { method: "GET", signal });
}
