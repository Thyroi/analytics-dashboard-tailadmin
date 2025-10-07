// src/app/api/analytics/v1/series/top-pages-range/route.ts
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

type XYSeries = { name: string; data: number[] };
type TopPagesRangePayload = {
  range: { start: string; end: string };
  property: string;
  categoriesLabels: string[]; // días YYYY-MM-DD
  series: XYSeries[]; // Top N + (opcional) "Total"
  top: number;
  metric: "screenPageViews";
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
    const top = Math.max(
      1,
      Math.min(20, Number(searchParams.get("top") || "5"))
    ); // default 5, máx 20
    const includeTotal = (searchParams.get("includeTotal") ?? "1") !== "0";

    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveAutoRangeForGranularity(g); // ⬅️ devuelve { start, end }
            return { start: r.start, end: r.end }; // ⬅️ usar las claves correctas
          })();

    const days = enumerateDaysUTC(range.start, range.end);
    const idxByDay = new Map(days.map((d, i) => [d, i]));

    // Auth + GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Vistas por título de página y día
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pageTitle" }, { name: "date" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // 1) Totales por título para decidir el Top N
    const totalsByTitle = new Map<string, number>();
    for (const r of rows) {
      const title = String(r.dimensionValues?.[0]?.value || "(not set)");
      const v = Number(r.metricValues?.[0]?.value || 0);
      totalsByTitle.set(title, (totalsByTitle.get(title) ?? 0) + v);
    }
    const topTitles = [...totalsByTitle.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([name]) => name);
    const topSet = new Set(topTitles);

    // 2) Construir series por día SOLO para el Top N (+ Total opcional)
    const seriesMap = new Map<string, number[]>();
    for (const t of topTitles) seriesMap.set(t, Array(days.length).fill(0));
    const totalData = includeTotal ? Array(days.length).fill(0) : null;

    for (const r of rows) {
      const title = String(r.dimensionValues?.[0]?.value || "(not set)");
      const d8 = String(r.dimensionValues?.[1]?.value || "");
      if (d8.length !== 8) continue;
      const iso = `${d8.slice(0, 4)}-${d8.slice(4, 6)}-${d8.slice(6, 8)}`;
      const idx = idxByDay.get(iso);
      if (idx === undefined) continue;

      const v = Number(r.metricValues?.[0]?.value || 0);

      if (totalData) totalData[idx] += v;
      if (topSet.has(title)) {
        const vec = seriesMap.get(title)!;
        vec[idx] += v;
      }
    }

    const series: XYSeries[] = topTitles.map((name) => ({
      name,
      data: seriesMap.get(name)!,
    }));
    if (includeTotal && totalData) {
      series.unshift({ name: "Total", data: totalData });
    }

    const payload: TopPagesRangePayload = {
      range,
      property,
      categoriesLabels: days,
      series,
      top,
      metric: "screenPageViews",
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
