/**
 * Utilidades para rutas de KPIs del header
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { runReportLimited } from "@/lib/utils/analytics/ga4RateLimit";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { analyticsdata_v1beta, google } from "googleapis";

/* ======================= Tipos ======================= */
export type KpiTotals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
  screenPageViews: number;
  averageSessionDuration: number; // segundos
};

export type KpiDeltas = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
  screenPageViews: number;
  averageSessionDuration: number;
};

export type KpiDeltaPct = {
  activeUsers: number | null;
  engagedSessions: number | null;
  eventCount: number | null;
  screenPageViews: number | null;
  averageSessionDuration: number | null;
};

export type KpiResponse = {
  range: { start: string; end: string };
  compareRange: { start: string; end: string };
  property: string;
  current: KpiTotals;
  previous: KpiTotals;
  delta: KpiDeltas;
  deltaPct: KpiDeltaPct;
};

/* ======================= Funciones ======================= */

/**
 * Query GA4 para obtener totales de KPIs
 */
export async function queryKpiTotals(
  analytics: analyticsdata_v1beta.Analyticsdata,
  property: string,
  start: string,
  end: string,
  additionalFilters?: analyticsdata_v1beta.Schema$FilterExpression[],
): Promise<KpiTotals> {
  const request: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: "activeUsers" },
      { name: "engagedSessions" },
      { name: "eventCount" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
    ],
    dimensionFilter: additionalFilters?.length
      ? {
          andGroup: {
            expressions: additionalFilters,
          },
        }
      : undefined,
    keepEmptyRows: false,
    limit: "1",
  };

  const resp = await runReportLimited(analytics, {
    property,
    requestBody: request,
  });

  const row = resp.data.rows?.[0];
  const m = row?.metricValues ?? [];
  const n = (i: number) => Number(m[i]?.value ?? 0);

  return {
    activeUsers: n(0),
    engagedSessions: n(1),
    eventCount: n(2),
    screenPageViews: n(3),
    averageSessionDuration: n(4),
  };
}

/**
 * Calcula deltas porcentuales para KPIs
 */
export function computeKpiDeltaPct(
  current: KpiTotals,
  previous: KpiTotals,
): KpiDeltaPct {
  const pct = (c: number, p: number): number | null =>
    p <= 0 ? (c > 0 ? 1 : null) : c / p - 1;

  return {
    activeUsers: pct(current.activeUsers, previous.activeUsers),
    engagedSessions: pct(current.engagedSessions, previous.engagedSessions),
    eventCount: pct(current.eventCount, previous.eventCount),
    screenPageViews: pct(current.screenPageViews, previous.screenPageViews),
    averageSessionDuration: pct(
      current.averageSessionDuration,
      previous.averageSessionDuration,
    ),
  };
}

/**
 * Calcula deltas absolutos para KPIs
 */
export function computeKpiDeltas(
  current: KpiTotals,
  previous: KpiTotals,
): KpiDeltas {
  return {
    activeUsers: current.activeUsers - previous.activeUsers,
    engagedSessions: current.engagedSessions - previous.engagedSessions,
    eventCount: current.eventCount - previous.eventCount,
    screenPageViews: current.screenPageViews - previous.screenPageViews,
    averageSessionDuration:
      current.averageSessionDuration - previous.averageSessionDuration,
  };
}

/**
 * Handler completo para rutas de KPIs - función reutilizable
 */
export async function handleKpiRequest(
  granularity: Granularity,
  startQ?: string | null,
  endQ?: string | null,
  additionalFilters?: analyticsdata_v1beta.Schema$FilterExpression[],
): Promise<KpiResponse> {
  // Calcular rangos usando función estandarizada
  const ranges = computeRangesForKPI(granularity, startQ, endQ);

  // Auth + GA4
  const auth = getAuth();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizePropertyId(resolvePropertyId());

  // Query paralelo para current y previous
  const [currentTotals, previousTotals] = await Promise.all([
    queryKpiTotals(
      analytics,
      property,
      ranges.current.start,
      ranges.current.end,
      additionalFilters,
    ),
    queryKpiTotals(
      analytics,
      property,
      ranges.previous.start,
      ranges.previous.end,
      additionalFilters,
    ),
  ]);

  // Calcular deltas
  const delta = computeKpiDeltas(currentTotals, previousTotals);
  const deltaPct = computeKpiDeltaPct(currentTotals, previousTotals);

  return {
    range: ranges.current,
    compareRange: ranges.previous,
    property,
    current: currentTotals,
    previous: previousTotals,
    delta,
    deltaPct,
  };
}
