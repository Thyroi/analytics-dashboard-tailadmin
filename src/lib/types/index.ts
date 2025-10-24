/**
 * Tipos compartidos a nivel de app (UI / genéricos).
 * No colocar aquí payloads específicos de endpoints.
 */

import type * as React from "react";

/** Resoluciones de tiempo usadas en dashboards/charts */
export type Granularity = "d" | "w" | "m" | "y";
export type KPIBucket = "day" | "week" | "month" | "year";

/**
 * WindowGranularity: granularidad para ventana de visualización (UI/charts)
 * Soporta todas las opciones: día, semana, mes, año
 */
export type WindowGranularity = "d" | "w" | "m" | "y";

/**
 * RequestGranularity: granularidad enviada a APIs externas (GA4, Chatbot)
 * Solo soporta: día o año (las APIs solo trabajan con estas dos)
 */
export type RequestGranularity = "d" | "y";

/** Serie simple para gráficos (línea/área/barras) */
export type SeriesPoint = { label: string; value: number };

/** Pie/Donut datum */
export type DonutDatum = {
  id?: string;
  label: string;
  value: number;
  color?: string;
};

/** URLs asociadas a un tag/pueblo (navegación interna/externa) */
export type Urls = {
  overview: string;
  map?: string;
  list?: string;
  external?: string;
};

export type TagMeta = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  urls?: Urls;
};

/** Diccionario de series por clave -> fecha ISO -> valor */
export type SeriesDict = Record<string, Record<string, number>>;

/** Import estático de imágenes (Next) */
export type StaticImageImport = { src: string };

/** Type guard para StaticImageImport */
export function isStaticImageImport(
  value: unknown
): value is StaticImageImport {
  return typeof value === "object" && value !== null && "src" in value;
}

/** Serie de KPI para el card (actual vs anterior) */
export type KPISeries = {
  bucket: Granularity;
  current: SeriesPoint[];
  previous: SeriesPoint[];
};

/** UI: modos de control en cards */
export type Mode = "granularity" | "range";

/** Rango de fechas ISO para consultas genéricas */
export type DateRange = { startTime: string; endTime: string } | null;

/** Punto genérico para series [{label, value}] */
export type Point = { label: string; value: number };

/** Métrica de la card */
export type Metric = "users" | "interactions" | "visits"; // visits = alias de users

/** Nombre de slice del HomeFiltersContext */
export type SliceName = "users" | "interactions";
