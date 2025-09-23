// src/app/api/analytics/v1/series/user-acquisition-range/route.ts
import type { Granularity } from "@/lib/types";
import {
  deriveAutoRangeForGranularity,
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

type SeriesItem = { name: string; data: number[] };
type AcquisitionRangePayload = {
  range: { start: string; end: string };
  property: string;
  categoriesLabels: string[]; // YYYY-MM-DD
  series: SeriesItem[]; // por canal + "Total"
};

function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  );
  const end = new Date(
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  );
  const out: string[] = [];
  while (cur <= end) {
    out.push(toISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const g = (searchParams.get("granularity") || "d") as Granularity;
    const includeTotal = (searchParams.get("includeTotal") ?? "1") !== "0";

    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveAutoRangeForGranularity(g);
            return { start: r.startTime, end: r.endTime };
          })();

    const days = enumerateDaysUTC(range.start, range.end);
    const indexByDate = new Map(days.map((d, i) => [d, i]));

    // Auth + GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usuarios activos por día y canal de adquisición (first-user)
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "firstUserDefaultChannelGroup" }, { name: "date" }],
      orderBys: [
        { dimension: { dimensionName: "date" } },
        { metric: { metricName: "activeUsers" }, desc: true },
      ],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // Canal -> vector de días
    const seriesMap = new Map<string, number[]>();
    const totalsByChannel = new Map<string, number>();

    for (const r of rows) {
      const channel = String(r.dimensionValues?.[0]?.value || "Unassigned");
      const d8 = String(r.dimensionValues?.[1]?.value || ""); // YYYYMMDD
      if (d8.length !== 8) continue;
      const iso = `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
      const idx = indexByDate.get(iso);
      if (idx === undefined) continue;

      const v = Number(r.metricValues?.[0]?.value || 0);
      if (!seriesMap.has(channel))
        seriesMap.set(channel, Array(days.length).fill(0));
      const vec = seriesMap.get(channel)!;
      vec[idx] += v;
      totalsByChannel.set(channel, (totalsByChannel.get(channel) ?? 0) + v);
    }

    // Ordenamos canales por total desc y formamos series
    const channels = [...seriesMap.keys()].sort(
      (a, b) => (totalsByChannel.get(b) ?? 0) - (totalsByChannel.get(a) ?? 0)
    );

    const series: SeriesItem[] = channels.map((name) => ({
      name,
      data: seriesMap.get(name)!,
    }));

    if (includeTotal) {
      const totalData = Array(days.length).fill(0);
      for (const s of series) {
        for (let i = 0; i < days.length; i++) totalData[i] += s.data[i];
      }
      series.unshift({ name: "Total", data: totalData });
    }

    const payload: AcquisitionRangePayload = {
      range: { start: range.start, end: range.end },
      property,
      categoriesLabels: days,
      series,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
