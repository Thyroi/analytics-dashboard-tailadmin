import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import type { Granularity, DonutDatum } from "@/lib/types";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import { parsePath, stripLangPrefix, normalizePath } from "@/lib/utils/url";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveAutoRangeForGranularity,
  prevComparable,
} from "@/lib/utils/datetime";
import { groupFromDailyMaps } from "@/lib/utils/charts";

/* ===================== Tipos/Helpers locales ===================== */

type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function toISODate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/* ============================== GET ============================== */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;
    const categoryId = (searchParams.get("categoryId") || "").trim() as CategoryId;

    if (!CATEGORY_ID_ORDER.includes(categoryId)) {
      return NextResponse.json(
        { error: `Invalid categoryId '${categoryId}'` },
        { status: 400 }
      );
    }

    // Rango actual + comparable
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveAutoRangeForGranularity(g, now);
    const prevPreset = prevComparable(currPreset);
    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // Auth + propiedad GA4
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const rawPropertyId = resolvePropertyId();
    if (!rawPropertyId) {
      return NextResponse.json(
        { error: "GA4 propertyId is missing (check resolvePropertyId/env vars)" },
        { status: 500 }
      );
    }
    const property = normalizePropertyId(rawPropertyId);

    // Report unificado (prev+curr), filtrado por page_view
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.previous.start, endDate: ranges.current.end }],
      metrics: [{ name: "eventCount" }, { name: "screenPageViews" }],
      dimensions: [{ name: "date" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
        },
      },
      keepEmptyRows: false,
      limit: "200000",
    };

    const resp = await analyticsData.properties.runReport({ property, requestBody: request });
    const rows = resp.data.rows ?? [];

    // Agregadores
    const currByDate = new Map<string, number>();
    const prevByDate = new Map<string, number>();
    const byTownCurrent = new Map<TownId, number>(); // donut (solo current)
    const urlEvents = new Map<string, number>(); // urlsTop (solo current)
    const urlViews = new Map<string, number>();

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const dRaw = String(dims[0]?.value ?? "");
      if (dRaw.length !== 8) continue;
      const iso = toISODate(dRaw);

      const pathRaw = String(dims[1]?.value ?? "");
      const { path } = stripLangPrefix(normalizePath(pathRaw));
      const parsed = parsePath(path);

      // Filtrar URLs que **pertenezcan** a la categoría solicitada
      if (!parsed.categoryId || parsed.categoryId !== categoryId) continue;

      const events = Number(mets[0]?.value ?? 0);
      const views = Number(mets[1]?.value ?? 0);

      const inCurrent = iso >= ranges.current.start && iso <= ranges.current.end;
      const inPrevious = iso >= ranges.previous.start && iso <= ranges.previous.end;

      if (inCurrent) {
        currByDate.set(iso, (currByDate.get(iso) ?? 0) + events);

        if (parsed.townId) {
          byTownCurrent.set(parsed.townId, (byTownCurrent.get(parsed.townId) ?? 0) + events);
        }

        urlEvents.set(path, (urlEvents.get(path) ?? 0) + events);
        urlViews.set(path, (urlViews.get(path) ?? 0) + views);
      } else if (inPrevious) {
        prevByDate.set(iso, (prevByDate.get(iso) ?? 0) + events);
      }
    }

    // Serie agrupada por granularidad
    const { series, totals } = groupFromDailyMaps(g, ranges, currByDate, prevByDate);

    // Donut por pueblos (current)
    const donut: DonutDatum[] = TOWN_ID_ORDER
      .map((t) => ({ label: t, value: byTownCurrent.get(t as TownId) ?? 0 }))
      .filter((d) => d.value > 0);

    // URLs top (current)
    const urlsTop = Array.from(urlEvents.entries())
      .map(([path, events]) => ({ url: path, path, events, views: urlViews.get(path) ?? 0 }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 200);

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        context: { categoryId },
        series,
        donut,
        deltaPct: pctDelta(totals.current, totals.previous),
        urlsTop,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
