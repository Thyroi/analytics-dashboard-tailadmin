import type { KpiPayload } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import {
  deriveRangeEndingYesterday,
  parseISO,
  toISO,
} from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function addDaysUTC(d: Date, days: number) {
  const n = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function daysInclusive(startISO: string, endISO: string): number {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const ms =
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) -
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

type Totals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
  screenPageViews: number;
  averageSessionDuration: number; // segundos
};

type TotalsWithMeta = {
  totals: Totals;
  meta: {
    subjectToThresholding: boolean;
    timeZone?: string | null;
  };
};

async function queryTotals(
  analytics: analyticsdata_v1beta.Analyticsdata,
  property: string,
  start: string,
  end: string
): Promise<TotalsWithMeta> {
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
  const data = resp.data; // Schema$RunReportResponse

  const row = data.rows?.[0];
  const m = row?.metricValues ?? [];
  const n = (i: number) => Number(m[i]?.value ?? 0);

  const totals: Totals = {
    activeUsers: n(0),
    engagedSessions: n(1),
    eventCount: n(2),
    screenPageViews: n(3),
    averageSessionDuration: n(4),
  };

  const meta = {
    subjectToThresholding: data.metadata?.subjectToThresholding === true,
    timeZone: data.metadata?.timeZone ?? null,
  };

  return { totals, meta };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startQ = searchParams.get("start") || undefined;
    const endQ = searchParams.get("end") || undefined;
    const granularity = (searchParams.get("granularity") || "d") as Granularity;

    // Rango actual: si llega start/end se usan; si no, preset acabando en AYER
    const range =
      startQ && endQ
        ? { start: startQ, end: endQ }
        : (() => {
            const r = deriveRangeEndingYesterday(granularity);
            return { start: r.startTime, end: r.endTime };
          })();

    // Rango anterior (misma longitud) inmediatamente antes del actual
    const len = daysInclusive(range.start, range.end);
    const curStart = parseISO(range.start);
    const prevEnd = addDaysUTC(curStart, -1);
    const prevStart = addDaysUTC(prevEnd, -(len - 1));
    const compareRange = { start: toISO(prevStart), end: toISO(prevEnd) };

    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const [cur, prev] = await Promise.all([
      queryTotals(analytics, property, range.start, range.end),
      queryTotals(analytics, property, compareRange.start, compareRange.end),
    ]);

    const current = cur.totals;
    const previous = prev.totals;

    // Deltas absolutos
    const delta = {
      activeUsers: current.activeUsers - previous.activeUsers,
      engagedSessions: current.engagedSessions - previous.engagedSessions,
      eventCount: current.eventCount - previous.eventCount,
      screenPageViews: current.screenPageViews - previous.screenPageViews,
      averageSessionDuration:
        current.averageSessionDuration - previous.averageSessionDuration,
    };

    // Deltas porcentuales
    const pct = (c: number, p: number): number | null =>
      p <= 0 ? (c > 0 ? 1 : null) : c / p - 1;

    const deltaPct = {
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
      metadata: {
        subjectToThresholding:
          cur.meta.subjectToThresholding || prev.meta.subjectToThresholding,
        timeZone: cur.meta.timeZone ?? prev.meta.timeZone ?? null,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
