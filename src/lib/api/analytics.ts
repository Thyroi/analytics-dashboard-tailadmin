/**
 * Helpers de API + Tipos de payloads de endpoints (FUENTE CANÓNICA).
 * No colocar aquí los fetchers (van en features/analytics/services/*).
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import { TownId } from "@/lib/taxonomy/towns";
import type {
  DateRange,
  DonutDatum,
  Granularity,
  Point,
  SeriesPoint,
} from "@/lib/types";

/* ============================ Helpers ============================ */

/** Construye querystring ignorando undefined/null */
export function buildQS(
  params: Record<string, string | number | boolean | null | undefined>
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  return sp.toString();
}

/* ---- type guards sin any ---- */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function getErrorMessage(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  const err = (raw as { error?: unknown }).error;

  if (typeof err === "string") return err;

  if (isRecord(err)) {
    const maybeMsg = (err as { message?: unknown }).message;
    if (typeof maybeMsg === "string") return maybeMsg;
  }
  return null;
}

/** fetch JSON con manejo de error {error} o {error:{message}} (sin any) */
export async function fetchJSON<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "cache-control": "no-cache", ...(init?.headers ?? {}) },
  });

  const raw: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = getErrorMessage(raw) ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return raw as T;
}
/* ====================== Payloads: Overview ======================= */

/** Respuesta normalizada del endpoint /api/analytics/v1/overview */
export type OverviewResponse = {
  meta: {
    range: DateRange; // {startTime, endTime} | null
    granularity: Granularity; // "d" | "w" | "m" | "y"
    timezone: "UTC";
    source: "wpideanto";
    property: string;
  };
  totals: {
    users: number;
    interactions: number;
  };
  series: {
    usersByBucket: Point[];
    interactionsByBucket: Point[];
  };
};

/* =========== Payloads: Categories/Towns Totals (dimensions) ====== */

export type CategoryTotals = {
  currentTotal: number;
  previousTotal: number;
  deltaPct: number;
};

export type CategoriesTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  categories: CategoryId[]; // canónico desde taxonomía
  perCategory: Record<CategoryId, CategoryTotals>;
};

export type TownsTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  towns: string[];
  perTown: Record<
    string,
    { currentTotal: number; previousTotal: number; deltaPct: number }
  >;
};

/* ======================= Payload: Devices OS ===================== */

export type DevicesOsResponse = {
  range: { start: string; end: string };
  property: string;
  items: DonutDatum[]; // [{label, value, color?}]
};

/* =================== Payload: Countries (demografía) ============= */

export type CountriesPayload = {
  range: { start: string; end: string };
  property: string;
  total: number;
  rows: Array<{
    country: string; // "Spain"
    code: string; // "ES" (ISO-3166 alpha-2)
    customers: number; // conteo
    pct: number; // 0..100
  }>;
};

/* ============================ Payloads: KPIs ===================== */

export type KpiMetricSet = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
  screenPageViews: number;
  averageSessionDuration: number; // segundos
};

export type KpiDeltaSet = {
  activeUsers: number | null;
  engagedSessions: number | null;
  eventCount: number | null;
  screenPageViews: number | null;
  averageSessionDuration: number | null;
};

export type KpiPayload = {
  range: { start: string; end: string };
  compareRange: { start: string; end: string };
  property: string;
  current: KpiMetricSet;
  previous: KpiMetricSet;
  delta: KpiMetricSet;
  deltaPct: KpiDeltaSet;
  metadata?: {
    subjectToThresholding: boolean;
    timeZone?: string | null;
  };
};

/* ===================== Payload: User Acquisition ================= */

export type AcquisitionRangePayload = {
  range: { start: string; end: string };
  property: string;
  granularity: Granularity; // "d" | "w" | "m" | "y"
  categoriesLabels: string[]; // eje X (fechas/slots)
  series: Array<{ name: string; data: number[] }>; // líneas por canal
};

/* ======================= Payload: Top Pages (range) ============== */

export type TopPagesRangeSeries = {
  /** Nombre en leyenda (título o path) */
  name: string;
  /** Valores alineados con xLabels (rango current) */
  data: number[];
  /** Path absoluto, útil para navegar (opcional) */
  path?: string;
};

/** Payload del endpoint /api/analytics/v1/header/top-pages-range */
export type TopPagesRangePayload = {
  granularity: Granularity;
  range: { start: string; end: string };
  xLabels: string[];
  /** Colección de series (incluido “Total” si includeTotal=true) */
  series: TopPagesRangeSeries[];
  /** Eco del flag de entrada; opcional para compatibilidad */
  includeTotal?: boolean;
};

// ...resto del archivo

export type DrilldownPayload = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  context: { townId?: TownId; categoryId?: CategoryId };

  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  donut: DonutDatum[];
  deltaPct: number;
  urlsTop: Array<{ url: string; path: string; events: number; views: number }>;

  // 🆕 opcional (solo cuando categoryId está presente en /pueblos/[id]/drilldown)
  xCategories?: string[]; // etiquetas del eje X
  multiSeries?: Array<{ name: string; data: number[] }>; // líneas por subactividad
};
