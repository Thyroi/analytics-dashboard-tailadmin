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
