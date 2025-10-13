// src/lib/utils/analytics/ga4.ts
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { groupFromDailyMaps } from "@/lib/utils/data/charts";
import {
  normalizePath,
  safePathname,
  stripLangPrefix,
} from "@/lib/utils/routing/url";
import type { GoogleAuth } from "google-auth-library";
import { analyticsdata_v1beta, google } from "googleapis";

// ✅ NUEVO: utilidades de ventanas unificadas
import {
  computeRangesFromQuery,
  type DateRange,
} from "@/lib/utils/time/timeWindows";

/* ---------------- tipos compartidos ---------------- */
export type Ranges = { current: DateRange; previous: DateRange };

/* ---------------- rangos comparables (política unificada) ---------------- */
/**
 * Devuelve rangos current/previous con política:
 *  - si pasas endISO: preset terminando en endISO (AYER si endISO="hoy")
 *  - si no pasas: preset terminando AYER
 *  - previous = desplazado con solape (d:1, w:7, m:30, y:1 año)
 */
export function buildComparableRanges(g: Granularity, endISO?: string): Ranges {
  // usa la ruta estándar de computeRangesFromQuery
  const { current, previous } = computeRangesFromQuery(
    g,
    undefined, // sin start
    endISO ?? null
  );
  return { current, previous };
}

/* ---------------- fechas/series ---------------- */
export function yyyymmddToISO(s: string): string {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Acumula métricas *diarias* separadas en current/previous */
export function rowsToDailyMaps(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  ranges: Ranges,
  cfg: {
    dateDimIndex?: number; // default 0
    pageLocDimIndex?: number; // default 1
    metricIndex?: number; // default 0
    /** sólo si quieres filtrar por path exacto (ignorando /final e idioma) */
    onlyForPath?: string;
  } = {}
) {
  const {
    dateDimIndex = 0,
    pageLocDimIndex = 1,
    metricIndex = 0,
    onlyForPath,
  } = cfg;

  const currentDaily = new Map<string, number>();
  const previousDaily = new Map<string, number>();

  if (!rows) return { currentDaily, previousDaily };

  for (const row of rows) {
    const dims = row.dimensionValues || [];
    const metrics = row.metricValues || [];
    if (dims.length <= dateDimIndex || metrics.length <= metricIndex) continue;

    const dateValue = dims[dateDimIndex]?.value;
    const metricValue = Number(metrics[metricIndex]?.value || 0);
    if (!dateValue) continue;

    // filtro opcional por path
    if (onlyForPath !== undefined) {
      const pageLocValue = dims[pageLocDimIndex]?.value || "";
      const normalizedPath = normalizePath(pageLocValue);
      const targetPath = normalizePath(onlyForPath);
      if (normalizedPath !== targetPath) continue;
    }

    const dateISO = yyyymmddToISO(dateValue);

    // clasificar en current o previous
    if (dateISO >= ranges.current.start && dateISO <= ranges.current.end) {
      currentDaily.set(dateISO, (currentDaily.get(dateISO) || 0) + metricValue);
    } else if (
      dateISO >= ranges.previous.start &&
      dateISO <= ranges.previous.end
    ) {
      previousDaily.set(
        dateISO,
        (previousDaily.get(dateISO) || 0) + metricValue
      );
    }
  }

  return { currentDaily, previousDaily };
}

/** Convierte mapas diarios en series de tiempo para gráficos */
export function dailyMapsToSeries(
  currentDaily: Map<string, number>,
  previousDaily: Map<string, number>,
  granularity: Granularity,
  ranges: Ranges
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  const result = groupFromDailyMaps(
    granularity,
    ranges,
    currentDaily,
    previousDaily
  );
  return result.series;
}

/* ---------------- analytics client ---------------- */
export function createAnalyticsClient(auth: GoogleAuth) {
  return google.analyticsdata({ version: "v1beta", auth });
}

/* ---------------- queries builders ---------------- */
export function buildBasicQuery(
  propertyId: string,
  dateRanges: analyticsdata_v1beta.Schema$DateRange[],
  dimensions: string[],
  metrics: string[]
): analyticsdata_v1beta.Schema$RunReportRequest {
  return {
    property: `properties/${propertyId}`,
    dateRanges,
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
  };
}

export function buildPathFilterQuery(
  propertyId: string,
  dateRanges: analyticsdata_v1beta.Schema$DateRange[],
  path: string,
  metrics: string[] = ["screenPageViews"]
): analyticsdata_v1beta.Schema$RunReportRequest {
  const normalizedPath = normalizePath(path);

  return {
    property: `properties/${propertyId}`,
    dateRanges,
    dimensions: [{ name: "date" }, { name: "pagePath" }],
    metrics: metrics.map((name) => ({ name })),
    dimensionFilter: {
      filter: {
        fieldName: "pagePath",
        stringFilter: {
          matchType: "CONTAINS",
          value: normalizedPath,
        },
      },
    },
  };
}

/* ---------------- donuts helpers ---------------- */
export function rowsToDonutData(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  cfg: {
    labelDimIndex?: number;
    metricIndex?: number;
    labelTransform?: (label: string) => string;
  } = {}
): DonutDatum[] {
  const { labelDimIndex = 0, metricIndex = 0, labelTransform = (x) => x } = cfg;

  if (!rows) return [];

  return rows
    .map((row) => {
      const dims = row.dimensionValues || [];
      const metrics = row.metricValues || [];

      if (dims.length <= labelDimIndex || metrics.length <= metricIndex) {
        return null;
      }

      const label = dims[labelDimIndex]?.value || "";
      const value = Number(metrics[metricIndex]?.value || 0);

      return {
        label: labelTransform(label),
        value,
      };
    })
    .filter((item): item is DonutDatum => item !== null && item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/* ---------------- path utilities ---------------- */
export function extractCleanPath(pagePath: string): string {
  // Eliminar idioma y normalizar
  const { path: withoutLang } = stripLangPrefix(pagePath);
  const pathname = safePathname(withoutLang);
  return normalizePath(pathname);
}

export function groupRowsByPath(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  cfg: {
    pathDimIndex?: number;
    metricIndex?: number;
  } = {}
): Map<string, number> {
  const { pathDimIndex = 1, metricIndex = 0 } = cfg;
  const pathGroups = new Map<string, number>();

  if (!rows) return pathGroups;

  for (const row of rows) {
    const dims = row.dimensionValues || [];
    const metrics = row.metricValues || [];

    if (dims.length <= pathDimIndex || metrics.length <= metricIndex) continue;

    const pagePath = dims[pathDimIndex]?.value || "";
    const metricValue = Number(metrics[metricIndex]?.value || 0);

    const cleanPath = extractCleanPath(pagePath);
    pathGroups.set(cleanPath, (pathGroups.get(cleanPath) || 0) + metricValue);
  }

  return pathGroups;
}

/* ---------------- date range builders ---------------- */
export function buildDateRanges(
  ranges: Ranges
): analyticsdata_v1beta.Schema$DateRange[] {
  return [
    {
      startDate: ranges.current.start,
      endDate: ranges.current.end,
      name: "current",
    },
    {
      startDate: ranges.previous.start,
      endDate: ranges.previous.end,
      name: "previous",
    },
  ];
}

export function buildSingleDateRange(
  range: DateRange
): analyticsdata_v1beta.Schema$DateRange[] {
  return [
    {
      startDate: range.start,
      endDate: range.end,
    },
  ];
}

/* ---------------- response processing ---------------- */
export function processGA4Response<T>(
  response: analyticsdata_v1beta.Schema$RunReportResponse | undefined,
  processor: (rows: analyticsdata_v1beta.Schema$Row[]) => T
): T | null {
  if (!response || !response.rows || response.rows.length === 0) {
    return null;
  }

  return processor(response.rows);
}

/* ---------------- error handling helpers ---------------- */
export function isGA4QuotaError(error: unknown): boolean {
  const errorStr = String(error);
  return /quota.*exceeded|rate.*limit|too many requests/i.test(errorStr);
}

export function isGA4AuthError(error: unknown): boolean {
  const errorStr = String(error);
  return /invalid.*credentials|authentication.*failed|unauthorized/i.test(
    errorStr
  );
}
