// src/app/api/analytics/v1/devices/os/route.ts
import type { DonutDatum, Granularity } from "@/lib/types";
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

type DevicesOsPayload = {
  range: { start: string; end: string };
  property: string;
  items: DonutDatum[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const g = (searchParams.get("granularity") || "d") as Granularity;

    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveRangeEndingYesterday(g);
            return { start: r.startTime, end: r.endTime };
          })();

    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "operatingSystem" }], // ⬅️ SIN "date"
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });
    const rows = resp.data.rows ?? [];

    const map: Record<string, number> = {};
    for (const r of rows) {
      const os = String(r.dimensionValues?.[0]?.value ?? "Other");
      const v = Number(r.metricValues?.[0]?.value ?? 0);
      map[os] = (map[os] ?? 0) + v;
    }

    const items = Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const payload: DevicesOsPayload = {
      range: {
        start: toISO(parseISO(range.start)),
        end: toISO(parseISO(range.end)),
      },
      property,
      items,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
