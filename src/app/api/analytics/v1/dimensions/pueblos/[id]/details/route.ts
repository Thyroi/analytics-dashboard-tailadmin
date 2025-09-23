import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { Granularity, SeriesPoint, DonutDatum } from "@/lib/types";

import {
  TOWN_ID_ORDER,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";
import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveAutoRangeForGranularity,
  prevComparable,
} from "@/lib/utils/datetime";

/* ====================== tipos ====================== */
type DateRange = { start: string; end: string };

/* ====================== url utils / tokens ====================== */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toTokens(baseLabel: string): string[] {
  const base = baseLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const kebab = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = base.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([kebab, compact].filter(Boolean)));
}
function pageRegexForTown(id: TownId): string {
  const label = TOWN_META[id].label;
  const alts = [...toTokens(label), id.toLowerCase()].map(escapeRe);
  const host = "^https?://[^/]+";
  const pathAlt = `(?:/(?:${alts.join("|")})(?:/|$)|[-_](?:${alts.join(
    "|"
  )})[-_]|${alts.join("|")})`;
  return `${host}.*${pathAlt}.*`;
}
function safePathname(raw: string): string {
  try {
    return new URL(raw).pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

/* ====================== helpers series/donut ====================== */
function accumulateDaily(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  within: DateRange
): Record<string, number> {
  const out: Record<string, number> = {};
  const rr = rows ?? [];
  for (const r of rr) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? ""); // YYYYMMDD
    if (dateRaw.length !== 8) continue;
    const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
      6,
      8
    )}`;
    if (iso < within.start || iso > within.end) continue;
    const val = Number(r.metricValues?.[0]?.value ?? 0);
    out[iso] = (out[iso] ?? 0) + val;
  }
  return out;
}
function dictToSeriesPoints(dict: Record<string, number>): SeriesPoint[] {
  return Object.keys(dict)
    .sort()
    .map((k) => ({ label: k, value: dict[k] ?? 0 }));
}

/** Donut: desglose por categorías (en el rango current) */
function donutByCategories(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  current: DateRange
): DonutDatum[] {
  const map: Record<string, number> = {};
  const rr = rows ?? [];

  const categoryTokens: Array<{
    id: CategoryId;
    tokens: string[];
    label: string;
  }> = CATEGORY_ID_ORDER.map((cid) => ({
    id: cid,
    tokens: Array.from(
      new Set([...toTokens(CATEGORY_META[cid].label), cid.toLowerCase()])
    ),
    label: CATEGORY_META[cid].label,
  }));

  for (const r of rr) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (dateRaw.length !== 8) continue;
    const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
      6,
      8
    )}`;
    if (iso < current.start || iso > current.end) continue;

    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const p = safePathname(url).toLowerCase();
    const val = Number(r.metricValues?.[0]?.value ?? 0);

    for (const c of categoryTokens) {
      if (
        c.tokens.some(
          (tok) =>
            p.includes(`/${tok}/`) ||
            p.endsWith(`/${tok}`) ||
            p.includes(`-${tok}-`) ||
            p.includes(`_${tok}_`) ||
            p.includes(tok)
        )
      ) {
        map[c.label] = (map[c.label] ?? 0) + val;
        break;
      }
    }
  }

  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ====================== handler ====================== */
export async function GET(
  req: Request,
  { params }: { params: { id: TownId } }
) {
  try {
    const url = new URL(req.url);
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    const id = params.id;
    if (!TOWN_ID_ORDER.includes(id)) {
      return NextResponse.json({ error: "TownId inválido" }, { status: 400 });
    }

    // Rango actual + comparable desde utils/datetime
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveAutoRangeForGranularity(g, now); // {startTime,endTime}
    const prevPreset = prevComparable(currPreset);

    const ranges = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Unimos prev+curr en un solo request, filtrando por page_view + regex del pueblo
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [
        { startDate: ranges.previous.start, endDate: ranges.current.end },
      ],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [
        { name: "date" },
        { name: "pageLocation" },
        { name: "eventName" },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "eventName",
                stringFilter: {
                  matchType: "EXACT",
                  value: "page_view",
                  caseSensitive: false,
                },
              },
            },
            {
              filter: {
                fieldName: "pageLocation",
                stringFilter: {
                  matchType: "FULL_REGEXP",
                  value: pageRegexForTown(id),
                  caseSensitive: false,
                },
              },
            },
          ],
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
      keepEmptyRows: false,
      limit: "200000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // Series por rango
    const currDict = accumulateDaily(rows, ranges.current);
    const prevDict = accumulateDaily(rows, ranges.previous);

    const series: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: dictToSeriesPoints(currDict),
      previous: dictToSeriesPoints(prevDict),
    };

    // Donut por categorías en el rango actual
    const donutData: DonutDatum[] = donutByCategories(rows, ranges.current);

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        property,
        id,
        title: TOWN_META[id].label,
        series,
        donutData,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
