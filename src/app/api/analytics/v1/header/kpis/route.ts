import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import { parseISO, toISO, deriveAutoRangeForGranularity } from "@/lib/utils/datetime";
import type { Granularity } from "@/lib/types";
import { KpiDeltaSet, KpiMetricSet, KpiPayload } from "@/lib/api/analytics";


export const dynamic = "force-dynamic";

function addDaysUTC(d: Date, days: number) {
  const n = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}
function daysInclusive(startISO: string, endISO: string): number {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const ms = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) -
             Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

async function queryTotals(
  analytics: analyticsdata_v1beta.Analyticsdata,
  property: string,
  start: string,
  end: string
): Promise<KpiMetricSet> {
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

  const resp = await analytics.properties.runReport({ property, requestBody: request });
  const row = resp.data.rows?.[0];
  const m = row?.metricValues ?? [];
  const n = (i: number) => Number(m[i]?.value ?? 0);

  return {
    activeUsers: n(0),
    engagedSessions: n(1),
    eventCount: n(2),
    screenPageViews: n(3),
    averageSessionDuration: n(4), // segundos
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const g = (searchParams.get("granularity") || "d") as Granularity;

    const range = start && end
      ? { start, end }
      : (() => {
          const r = deriveAutoRangeForGranularity(g);
          return { start: r.startTime, end: r.endTime };
        })();

    const len = daysInclusive(range.start, range.end);
    const curStart = parseISO(range.start);
    const prevEnd = addDaysUTC(curStart, -1);
    const prevStart = addDaysUTC(prevEnd, -(len - 1));
    const compareRange = { start: toISO(prevStart), end: toISO(prevEnd) };

    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const [current, previous] = await Promise.all([
      queryTotals(analytics, property, range.start, range.end),
      queryTotals(analytics, property, compareRange.start, compareRange.end),
    ]);

    const delta: KpiMetricSet = {
      activeUsers: current.activeUsers - previous.activeUsers,
      engagedSessions: current.engagedSessions - previous.engagedSessions,
      eventCount: current.eventCount - previous.eventCount,
      screenPageViews: current.screenPageViews - previous.screenPageViews,
      averageSessionDuration:
        current.averageSessionDuration - previous.averageSessionDuration,
    };

    const pct = (c: number, p: number): number | null =>
      p <= 0 ? (c > 0 ? 1 : null) : c / p - 1;

    const deltaPct: KpiDeltaSet = {
      activeUsers: pct(current.activeUsers, previous.activeUsers),
      engagedSessions: pct(current.engagedSessions, previous.engagedSessions),
      eventCount: pct(current.eventCount, previous.eventCount),
      screenPageViews: pct(current.screenPageViews, previous.screenPageViews),
      averageSessionDuration: pct(
        current.averageSessionDuration,
        previous.averageSessionDuration
      ),
    };

    const payload: KpiPayload = {
      range,
      compareRange,
      property,
      current,
      previous,
      delta,
      deltaPct,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
