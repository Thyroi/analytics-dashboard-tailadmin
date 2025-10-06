import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse, type NextRequest } from "next/server";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";

import {
  deriveRangeEndingYesterday,
  parseISO,
  prevComparable,
  todayUTC,
} from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { buildAxisForGranularity } from "@/lib/utils/timeAxis";
import { normalizePath, stripLangPrefix } from "@/lib/utils/url";

/* ---------------- helpers ---------------- */

type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function normToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** slug → CategoryId (usa sinónimos oficiales) */
function buildSlugToCategory(): Record<string, CategoryId> {
  const map: Record<string, CategoryId> = {};
  for (const cid of CATEGORY_ID_ORDER) {
    const base: string[] = [
      cid,
      CATEGORY_META[cid].label,
      ...(CATEGORY_SYNONYMS[cid] ?? []),
    ].filter(Boolean) as string[];
    for (const v of base) map[normToken(v)] = cid;
  }
  return map;
}
const SLUG2CAT: Record<string, CategoryId> = buildSlugToCategory();

/** Extrae townId / categoryId / subSlug de un path (ya sin prefijo de idioma) */
function parseTownCatSub(path: string): {
  townId?: TownId;
  categoryId?: CategoryId;
  subSlug?: string;
} {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) return {};
  const segs = clean.split("/").map(normToken);

  // town
  const townIdx = segs.findIndex((s) =>
    (TOWN_ID_ORDER as readonly string[]).includes(s)
  );
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

export async function GET(req: NextRequest, ctx: unknown) {
  try {
    const { id } = (ctx as { params: { id: string } }).params;

    if (!(TOWN_ID_ORDER as readonly string[]).includes(id)) {
      return NextResponse.json(
        { error: `Invalid townId '${id}'` },
        { status: 400 }
      );
    }
    const townId = id as TownId;

    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;
    const categoryIdParam = (searchParams.get("categoryId") || "").trim() as
      | CategoryId
      | "";

    if (
      categoryIdParam &&
      !CATEGORY_ID_ORDER.includes(categoryIdParam as CategoryId)
    ) {
      return NextResponse.json(
        { error: `Invalid categoryId '${categoryIdParam}'` },
        { status: 400 }
      );
    }

    // rangos (terminando AYER) — para 'd' queremos 7 días (dayAsWeek=true)
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveRangeEndingYesterday(g, now, g === "d");
    const prevPreset = prevComparable(currPreset);
    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // EJE / BUCKETS
    const axis = buildAxisForGranularity(g, ranges);
    const N = axis.xLabels.length;

    // GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [
        { startDate: ranges.previous.start, endDate: ranges.current.end },
      ],
      metrics: [{ name: "eventCount" }],
      dimensions: [
        { name: axis.dimensionTime },
        { name: "pageLocation" },
        { name: "eventName" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "page_view",
            caseSensitive: false,
          },
        },
      },
      keepEmptyRows: false,
      limit: "200000",
    };

    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: request,
    });
    const rows = resp.data.rows ?? [];

    // agregadores
    const currVec = Array(N).fill(0) as number[];
    const prevVec = Array(N).fill(0) as number[];

    // sin categoryId → donut por categorías (current)
    const byCategoryCurrent = new Map<CategoryId, number>();

    // con categoryId → donut por sub-actividad + series por URL (current)
    const bySubCurrent = new Map<string, number>();
    const urlVecs = new Map<string, number[]>(); // url -> vector current (N)

    const useCategoryMode = Boolean(categoryIdParam);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const slotRaw = String(dims[0]?.value ?? ""); // date(YYYYMMDD) || yearMonth(YYYYMM)
      const locRaw = String(dims[1]?.value ?? "");
      const events = Number(mets[0]?.value ?? 0);

      // key de slot según dimensionTime
      let slotKey: string | null = null;
      if (axis.dimensionTime === "date") {
        if (slotRaw.length === 8) {
          slotKey = `${slotRaw.slice(0, 4)}-${slotRaw.slice(
            4,
            6
          )}-${slotRaw.slice(6, 8)}`;
        }
      } else {
        if (slotRaw.length === 6) slotKey = slotRaw; // YYYYMM
      }
      if (!slotKey) continue;

      const { path } = stripLangPrefix(normalizePath(locRaw));
      const parsed = parseTownCatSub(path);
      if (parsed.townId !== townId) continue;

      // ¿current o previous?
      const iCur = axis.indexByCurKey.get(slotKey);
      const iPrev = axis.indexByPrevKey.get(slotKey);
      if (iCur !== undefined) currVec[iCur] += events;
      else if (iPrev !== undefined) prevVec[iPrev] += events;
      else continue;

      // Solo CURRENT alimenta donut/seriesByUrl
      if (iCur === undefined) continue;

      if (!useCategoryMode) {
        const cid = parsed.categoryId;
        if (cid)
          byCategoryCurrent.set(
            cid,
            (byCategoryCurrent.get(cid) ?? 0) + events
          );
      } else {
        const cid = parsed.categoryId;
        if (!cid || cid !== categoryIdParam) continue;

        // sub-actividad
        const clean = path.replace(/^\/+|\/+$/g, "");
        const segs = clean.split("/");
        const townIdx = segs.findIndex((s) => normToken(s) === townId);
        const sub = segs[townIdx + 2] ? segs[townIdx + 2] : `${townId}/${cid}`;
        bySubCurrent.set(sub, (bySubCurrent.get(sub) ?? 0) + events);

        // series por URL /town/cat/sub/
        const url = "/" + segs.slice(0, townIdx + 3).join("/") + "/";
        if (!urlVecs.has(url)) urlVecs.set(url, Array(N).fill(0));
        urlVecs.get(url)![iCur] += events;
      }
    }

    // serie total (alineada a xLabels current)
    const series: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label, i) => ({
        label,
        value: currVec[i] ?? 0,
      })),
      previous: axis.xLabels.map((label, i) => ({
        label,
        value: prevVec[i] ?? 0,
      })),
    };
    const totals = {
      current: currVec.reduce((a, b) => a + b, 0),
      previous: prevVec.reduce((a, b) => a + b, 0),
    };

    if (!useCategoryMode) {
      const donut: DonutDatum[] = CATEGORY_ID_ORDER.map((cid) => ({
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
          xLabels: axis.xLabels,
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

    const seriesByUrl = Array.from(urlVecs.entries()).map(([url, vec]) => ({
      name: url,
      data: vec,
      path: url,
    }));

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        context: { townId, categoryId: categoryIdParam },
        series,
        xLabels: axis.xLabels,
        donut,
        seriesByUrl,
        deltaPct: pctDelta(totals.current, totals.previous),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
