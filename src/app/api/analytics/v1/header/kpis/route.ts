// src/app/api/analytics/v1/header/kpis/route.ts
import type { KpiPayload } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

import { computeRangesFromQuery } from "@/lib/utils/time/timeWindows";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ======================= tipos internos ======================= */
type Totals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
  screenPageViews: number;
  averageSessionDuration: number; // segundos
};

async function queryTotals(
  analytics: analyticsdata_v1beta.Analyticsdata,
  property: string,
  start: string,
  end: string
): Promise<Totals> {
  const request: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: "activeUsers" },
      { name: "engagedSessions" },
      { name: "eventCount" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
    ],
    keepEmptyRows: false,
    limit: "1",
  };

  const resp = await analytics.properties.runReport({
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

/* ======================= handler ======================= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const startQ = sp.get("start");
    const endQ = sp.get("end");
    const granularity = (sp.get("granularity") || "d") as Granularity;

    // RANGOS con política unificada (desplazado con solape)
    const { current, previous } = computeRangesFromQuery(
      granularity,
      startQ,
      endQ
    );

    // Auth + GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const [currentTotals, previousTotals] = await Promise.all([
      queryTotals(analytics, property, current.start, current.end),
      queryTotals(analytics, property, previous.start, previous.end),
    ]);

    // Deltas absolutos
    const delta = {
      activeUsers: currentTotals.activeUsers - previousTotals.activeUsers,
      engagedSessions:
        currentTotals.engagedSessions - previousTotals.engagedSessions,
      eventCount: currentTotals.eventCount - previousTotals.eventCount,
      screenPageViews:
        currentTotals.screenPageViews - previousTotals.screenPageViews,
      averageSessionDuration:
        currentTotals.averageSessionDuration -
        previousTotals.averageSessionDuration,
    };

    // Deltas %
    const pct = (c: number, p: number): number | null =>
      p <= 0 ? (c > 0 ? 1 : null) : c / p - 1;

    const deltaPct = {
      activeUsers: pct(currentTotals.activeUsers, previousTotals.activeUsers),
      engagedSessions: pct(
        currentTotals.engagedSessions,
        previousTotals.engagedSessions
      ),
      eventCount: pct(currentTotals.eventCount, previousTotals.eventCount),
      screenPageViews: pct(
        currentTotals.screenPageViews,
        previousTotals.screenPageViews
      ),
      averageSessionDuration: pct(
        currentTotals.averageSessionDuration,
        previousTotals.averageSessionDuration
      ),
    };

    const payload: KpiPayload = {
      range: { start: current.start, end: current.end },
      compareRange: { start: previous.start, end: previous.end },
      property,
      current: currentTotals,
      previous: previousTotals,
      delta,
      deltaPct,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
