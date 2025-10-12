// src/lib/analytics/ga4Requests.ts
import type { analyticsdata_v1beta } from "googleapis";
import type { DateRange } from "./timeWindows";

/**
 * Construye una RunReportRequest que consulta la **unión**
 * previous.start → current.end. Útil para clasificar filas en current/previous
 * sin hacer 2 viajes a GA4.
 */
export function buildUnionRunReportRequest(params: {
  current: DateRange;
  previous: DateRange;
  metrics: { name: string }[];
  dimensions: { name: string }[];
  /** Filtro compuesto (andGroup / orGroup / filter). Lo pasas tal cual. */
  dimensionFilter?: analyticsdata_v1beta.Schema$FilterExpression;
  /** Límite de filas (string por API) */
  limit?: string;
  keepEmptyRows?: boolean;
}): analyticsdata_v1beta.Schema$RunReportRequest {
  const {
    current,
    previous,
    metrics,
    dimensions,
    dimensionFilter,
    limit = "200000",
    keepEmptyRows = false,
  } = params;

  const req: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: previous.start, endDate: current.end }],
    metrics,
    dimensions,
    keepEmptyRows,
    limit,
  };

  if (dimensionFilter) {
    req.dimensionFilter = dimensionFilter;
  }

  return req;
}

/**
 * Configuraciones comunes de dimensiones para analytics
 */
export const GA4_DIMENSIONS = {
  /** Dimensiones básicas para análisis temporal con URLs */
  TEMPORAL_WITH_URL: [
    { name: "date" },
    { name: "pageLocation" },
    { name: "eventName" },
  ] as { name: string }[],

  /** Dimensiones para análisis anual (por mes) con URLs */
  TEMPORAL_MONTHLY_WITH_URL: [
    { name: "yearMonth" },
    { name: "pageLocation" },
    { name: "eventName" },
  ] as { name: string }[],

  /** Solo fecha para análisis temporales básicos */
  TEMPORAL_BASIC: [{ name: "date" }] as { name: string }[],

  /** Para análisis de páginas */
  PAGE_ANALYSIS: [{ name: "pageTitle" }, { name: "date" }] as {
    name: string;
  }[],
} as const;

/**
 * Filtros comunes para analytics
 */
export const GA4_FILTERS = {
  /** Filtro para solo page_view events */
  PAGE_VIEW_ONLY: {
    filter: {
      fieldName: "eventName",
      stringFilter: {
        matchType: "EXACT" as const,
        value: "page_view",
        caseSensitive: false,
      },
    },
  },
} as const;

/**
 * Helper para crear requests comunes con dimensiones adaptadas por granularidad
 */
export function buildPageViewUnionRequest(params: {
  current: DateRange;
  previous: DateRange;
  granularity?: string;
  metrics?: { name: string }[];
  limit?: string;
}): analyticsdata_v1beta.Schema$RunReportRequest {
  const dimensions =
    params.granularity === "y"
      ? GA4_DIMENSIONS.TEMPORAL_MONTHLY_WITH_URL
      : GA4_DIMENSIONS.TEMPORAL_WITH_URL;

  return buildUnionRunReportRequest({
    ...params,
    metrics: params.metrics || [{ name: "eventCount" }],
    dimensions,
    dimensionFilter: GA4_FILTERS.PAGE_VIEW_ONLY,
  });
}

/**
 * Helper para crear requests con filtros combinados (page_view + otro filtro)
 */
export function buildPageViewWithFilterUnionRequest(params: {
  current: DateRange;
  previous: DateRange;
  additionalFilter: analyticsdata_v1beta.Schema$FilterExpression;
  metrics?: { name: string }[];
  limit?: string;
}): analyticsdata_v1beta.Schema$RunReportRequest {
  return buildUnionRunReportRequest({
    ...params,
    metrics: params.metrics || [{ name: "eventCount" }],
    dimensions: GA4_DIMENSIONS.TEMPORAL_WITH_URL,
    dimensionFilter: {
      andGroup: {
        expressions: [GA4_FILTERS.PAGE_VIEW_ONLY, params.additionalFilter],
      },
    },
  });
}
