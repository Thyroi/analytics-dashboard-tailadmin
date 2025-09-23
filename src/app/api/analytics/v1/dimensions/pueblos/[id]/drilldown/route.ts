// src/app/api/analytics/v1/dimensions/pueblos/[id]/drilldown/route.ts
import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import type { Granularity, DonutDatum } from "@/lib/types";

import {
  TOWN_ID_ORDER,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveAutoRangeForGranularity,
  prevComparable,
} from "@/lib/utils/datetime";
import { groupFromDailyMaps } from "@/lib/utils/charts";
import { normalizePath, stripLangPrefix } from "@/lib/utils/url";

/* ---------------- helpers ---------------- */

type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function toISODate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function normToken(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Construye mapa slug-normalizado → CategoryId usando tus sinónimos oficiales */
function buildSlugToCategory(): Record<string, CategoryId> {
  const map: Record<string, CategoryId> = {};
  for (const cid of CATEGORY_ID_ORDER) {
    const base: string[] = [
      cid,                               // id
      CATEGORY_META[cid].label,          // label mostrado
      ...(CATEGORY_SYNONYMS[cid] ?? []), // sinónimos desde taxonomy ✅
    ].filter(Boolean) as string[];

    for (const v of base) map[normToken(v)] = cid;
  }
  return map;
}

const SLUG2CAT: Record<string, CategoryId> = buildSlugToCategory();

/** Extrae townId / categoryId / subSlug de un path (ya sin prefijo de idioma) */
function parseTownCatSub(path: string): { townId?: TownId; categoryId?: CategoryId; subSlug?: string } {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) return {};
  const segs = clean.split("/").map(normToken);

  // town
  const townIdx = segs.findIndex((s) => (TOWN_ID_ORDER as readonly string[]).includes(s));
  if (townIdx === -1) return {};

  const townId = segs[townIdx] as TownId;

  // categoría (siguiente segmento)
  const catSeg = segs[townIdx + 1];
  const categoryId = catSeg ? SLUG2CAT[catSeg] : undefined;

  // sub
  const subSlug = segs[townIdx + 2];

  return { townId, categoryId, subSlug };
}

/* ---------------- handler ---------------- */

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const townId = params.id as TownId;
    if (!TOWN_ID_ORDER.includes(townId)) {
      return NextResponse.json({ error: `Invalid townId '${townId}'` }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;
    const categoryIdParam = (searchParams.get("categoryId") || "").trim() as CategoryId | "";

    if (categoryIdParam && !CATEGORY_ID_ORDER.includes(categoryIdParam as CategoryId)) {
      return NextResponse.json({ error: `Invalid categoryId '${categoryIdParam}'` }, { status: 400 });
    }

    // rangos
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveAutoRangeForGranularity(g, now);
    const prevPreset = prevComparable(currPreset);
    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // GA
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

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

    // agregadores
    const currByDate = new Map<string, number>();
    const prevByDate = new Map<string, number>();

    // sin categoryId → donut por categorías
    const byCategoryCurrent = new Map<CategoryId, number>();

    // con categoryId → donut por sub-actividad + series por URL
    const bySubCurrent = new Map<string, number>(); // subSlug/path base -> total
    const urlDailyCurrent = new Map<string, Map<string, number>>(); // url -> (dateISO -> events)

    const useCategoryMode = Boolean(categoryIdParam);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const dRaw = String(dims[0]?.value ?? "");
      if (dRaw.length !== 8) continue;
      const iso = toISODate(dRaw);

      const urlRaw = String(dims[1]?.value ?? "");
      const { path } = stripLangPrefix(normalizePath(urlRaw));
      const parsed = parseTownCatSub(path);

      if (parsed.townId !== townId) continue;

      const events = Number(mets[0]?.value ?? 0);

      const inCurrent = iso >= ranges.current.start && iso <= ranges.current.end;
      const inPrevious = iso >= ranges.previous.start && iso <= ranges.previous.end;

      // serie total
      if (inCurrent) {
        currByDate.set(iso, (currByDate.get(iso) ?? 0) + events);
      } else if (inPrevious) {
        prevByDate.set(iso, (prevByDate.get(iso) ?? 0) + events);
      }

      if (!inCurrent) continue;

      if (!useCategoryMode) {
        // donut por categoría (usa clasificación por sinónimos)
        const cid = parsed.categoryId;
        if (cid) byCategoryCurrent.set(cid, (byCategoryCurrent.get(cid) ?? 0) + events);
      } else {
        // requiere coincidencia de categoría
        const cid = parsed.categoryId;
        if (!cid || cid !== categoryIdParam) continue;

        // sub-actividad: segmento siguiente, o el propio /town/cat/
        const clean = path.replace(/^\/+|\/+$/g, "");
        const segs = clean.split("/");
        const townIdx = segs.findIndex((s) => normToken(s) === townId);
        const sub = segs[townIdx + 2] ? segs[townIdx + 2] : `${townId}/${cid}`;

        bySubCurrent.set(sub, (bySubCurrent.get(sub) ?? 0) + events);

        // series por URL (alineada a fechas actuales)
        const url = "/" + segs.slice(0, townIdx + 3).join("/") + "/"; // /town/cat/sub/
        if (!urlDailyCurrent.has(url)) urlDailyCurrent.set(url, new Map<string, number>());
        const dict = urlDailyCurrent.get(url)!;
        dict.set(iso, (dict.get(iso) ?? 0) + events);
      }
    }

    // serie total agrupada
    const { series, totals } = groupFromDailyMaps(g, ranges, currByDate, prevByDate);
    const xLabels = series.current.map((p) => p.label);

    if (!useCategoryMode) {
      const donut: DonutDatum[] = CATEGORY_ID_ORDER
        .map((cid) => ({
          label: CATEGORY_META[cid].label,
          value: byCategoryCurrent.get(cid) ?? 0,
        }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);

      return NextResponse.json(
        {
          granularity: g,
          range: ranges,
          context: { townId },
          series,
          xLabels,
          donut,
          deltaPct: pctDelta(totals.current, totals.previous),
          seriesByUrl: [],
        },
        { status: 200 }
      );
    }

    const donut: DonutDatum[] = Array.from(bySubCurrent.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const seriesByUrl = Array.from(urlDailyCurrent.entries()).map(([url, daily]) => {
      const { series: s } = groupFromDailyMaps(g, ranges, daily, new Map<string, number>());
      return {
        name: url,
        data: s.current.map((p) => p.value),
        path: url,
      };
    });

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        context: { townId, categoryId: categoryIdParam },
        series,
        xLabels,
        donut,
        seriesByUrl,
        deltaPct: pctDelta(totals.current, totals.previous),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
