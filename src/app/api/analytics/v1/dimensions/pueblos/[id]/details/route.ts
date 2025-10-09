import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse, type NextRequest } from "next/server";

import {
  addDaysUTC,
  deriveRangeEndingYesterday,
  parseISO,
  todayUTC,
  toISO,
} from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { normalizePath, stripLangPrefix } from "@/lib/utils/url";

/* ====================== tipos/ayudas ====================== */
type DateRange = { start: string; end: string };
type UrlSeries = { name: string; data: number[]; path: string };

function toISODate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(
    6,
    8
  )}`;
}
function shiftRangeByDays(range: DateRange, days: number): DateRange {
  const s = addDaysUTC(parseISO(range.start), days);
  const e = addDaysUTC(parseISO(range.end), days);
  return { start: toISO(s), end: toISO(e) };
}
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
function ymKey(y: number, mZero: number) {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}${mm}`;
}
function ymLabel(y: number, mZero: number) {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}-${mm}`;
}
function listLastNMonths(endDate: Date, n = 12) {
  const labels: string[] = [];
  const keys: string[] = [];
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - i, 1));
    labels.push(ymLabel(d.getUTCFullYear(), d.getUTCMonth()));
    keys.push(ymKey(d.getUTCFullYear(), d.getUTCMonth()));
  }
  return { labels, keys };
}

/* ---------- sinónimos categoría y parser /town/cat/sub ---------- */
function normToken(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
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
const SLUG2CAT = buildSlugToCategory();

function parseTownCatSub(path: string): {
  townId?: TownId;
  categoryId?: CategoryId;
  subSlug?: string;
} {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) return {};
  const segs = clean.split("/").map(normToken);

  const townIdx = segs.findIndex((s) =>
    (TOWN_ID_ORDER as readonly string[]).includes(s)
  );
  if (townIdx === -1) return {};

  const tId = segs[townIdx] as TownId;
  const catSeg = segs[townIdx + 1];
  const cId = catSeg ? SLUG2CAT[catSeg] : undefined;
  const sub = segs[townIdx + 2];

  return { townId: tId, categoryId: cId, subSlug: sub };
}

/* ====================== handler ====================== */
type RouteParams = { id: string };

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<RouteParams> } // ⬅️ params puede ser Promise
) {
  try {
    const { id } = await ctx.params; // ⬅️ await obligatorio
    const townId = id as TownId;

    if (!TOWN_ID_ORDER.includes(townId)) {
      return NextResponse.json(
        { error: `TownId inválido: ${townId}` },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;
    const categoryIdParam = (
      url.searchParams.get("categoryId") || ""
    ).trim() as CategoryId | "";

    if (
      categoryIdParam &&
      !CATEGORY_ID_ORDER.includes(categoryIdParam as CategoryId)
    ) {
      return NextResponse.json(
        { error: `Invalid categoryId '${categoryIdParam}'` },
        { status: 400 }
      );
    }

    // Serie → d usa dayAsWeek; Donut → si d, sólo el día final; si no, mismo rango
    const now = endISO ? parseISO(endISO) : todayUTC();
    const dayAsWeek = g === "d";
    const cur = deriveRangeEndingYesterday(g, now, dayAsWeek);
    const current: DateRange = { start: cur.startTime, end: cur.endTime };
    const previous: DateRange = shiftRangeByDays(current, -1);

    // 🔧 FIX: Para granularidad diaria, donut usa current.end - 1 (día anterior); para otras, mismo rango que series
    const donutWindow: DateRange =
      g === "d"
        ? (() => {
            const prevDay = toISO(addDaysUTC(parseISO(current.end), -1));
            return { start: prevDay, end: prevDay }; // current.end - 1
          })()
        : current; // Mismo rango que las series

    // Eje
    const isYearly = g === "y";
    let xLabels: string[] = [];
    let curKeys: string[] = [];
    let prevKeys: string[] = [];
    let curIndex = new Map<string, number>();
    let prevIndex = new Map<string, number>();

    if (isYearly) {
      const { labels: curLbl, keys: curK } = listLastNMonths(
        parseISO(current.end),
        12
      );
      const { keys: prvK } = listLastNMonths(parseISO(previous.end), 12);
      xLabels = curLbl;
      curKeys = curK;
      prevKeys = prvK;
      curIndex = new Map(curKeys.map((k, i) => [k, i]));
      prevIndex = new Map(prevKeys.map((k, i) => [k, i]));
    } else {
      xLabels = enumerateDaysUTC(current.start, current.end);
      const prevDays = enumerateDaysUTC(previous.start, previous.end);
      curKeys = xLabels; // YYYY-MM-DD
      prevKeys = prevDays;
      curIndex = new Map(curKeys.map((k, i) => [k, i]));
      prevIndex = new Map(prevKeys.map((k, i) => [k, i]));
    }

    // GA4: prev+cur juntos y filtramos en código
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: previous.start, endDate: current.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [
        { name: "date" },
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

    // acumuladores serie
    const curVec = Array(curKeys.length).fill(0);
    const prevVec = Array(prevKeys.length).fill(0);

    // Donuts y series por URL
    const byCategoryCurrent = new Map<CategoryId, number>(); // cuando NO hay categoryIdParam
    const bySubCurrent = new Map<string, number>(); // cuando SÍ hay categoryIdParam
    const urlDailyCurrent = new Map<string, Map<string, number>>(); // url -> (key -> value) (cuando SÍ hay categoryIdParam)

    const useCategoryMode = Boolean(categoryIdParam);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const dRaw = String(dims[0]?.value ?? "");
      if (dRaw.length !== 8) continue;

      const iso = toISODate(dRaw);
      const keyDay = iso;
      const keyMonth = dRaw.slice(0, 6);

      const urlRaw = String(dims[1]?.value ?? "");
      const { path } = stripLangPrefix(normalizePath(urlRaw));

      const v = Number(mets[0]?.value ?? 0);

      // 🔧 FIX: Parsear y filtrar por pueblo ANTES de acumular series
      const parsed = parseTownCatSub(path);
      if (parsed.townId !== townId) continue;

      const inCur = iso >= current.start && iso <= current.end;
      const inPrev = iso >= previous.start && iso <= previous.end;

      // Serie total (ahora ya filtrada por pueblo específico)
      if (inCur) {
        const k = isYearly ? keyMonth : keyDay;
        const idx = curIndex.get(k);
        if (idx !== undefined) curVec[idx] += v;
      }
      if (inPrev) {
        const k = isYearly ? keyMonth : keyDay;
        const idx = prevIndex.get(k);
        if (idx !== undefined) prevVec[idx] += v;
      }

      // Donut/seriesByUrl sólo dentro del donutWindow
      if (iso < donutWindow.start || iso > donutWindow.end) continue;

      if (!useCategoryMode) {
        // Nivel 1 dentro del pueblo: donut de CATEGORÍAS
        const cid = parsed.categoryId;
        if (cid)
          byCategoryCurrent.set(cid, (byCategoryCurrent.get(cid) ?? 0) + v);
      } else {
        // Nivel 2: pueblo ∧ categoría
        const cid = parsed.categoryId;
        if (!cid || cid !== categoryIdParam) continue;

        // sub = segmento siguiente o fallback /town/category
        const clean = path.replace(/^\/+|\/+$/g, "");
        const segs = clean.split("/");
        const townIdx = segs.findIndex((s) => normToken(s) === townId);
        const sub = segs[townIdx + 2] ? segs[townIdx + 2] : `${townId}/${cid}`;
        bySubCurrent.set(sub, (bySubCurrent.get(sub) ?? 0) + v);

        // Serie por URL (hasta /town/category/sub/)
        const baseUrl = "/" + segs.slice(0, townIdx + 3).join("/") + "/";
        if (!urlDailyCurrent.has(baseUrl)) {
          urlDailyCurrent.set(baseUrl, new Map<string, number>());
        }
        const dict = urlDailyCurrent.get(baseUrl)!;
        const k = isYearly ? keyMonth : keyDay;
        dict.set(k, (dict.get(k) ?? 0) + v);
      }
    }

    const series = {
      current: xLabels.map((lbl, i) => ({ label: lbl, value: curVec[i] ?? 0 })),
      previous: xLabels.map((lbl, i) => ({
        label: lbl,
        value: prevVec[i] ?? 0,
      })),
    };
    const totalCur = curVec.reduce((a, b) => a + b, 0);
    const totalPrev = prevVec.reduce((a, b) => a + b, 0);
    const deltaPct =
      totalPrev > 0 ? ((totalCur - totalPrev) / totalPrev) * 100 : 0;

    let donut: Array<{ label: string; value: number }>;
    let seriesByUrl: UrlSeries[] = [];

    if (!useCategoryMode) {
      // donut por CATEGORÍAS (pueblo sin categoría seleccionada)
      donut = CATEGORY_ID_ORDER.map((cid) => ({
        label: CATEGORY_META[cid].label,
        value: byCategoryCurrent.get(cid) ?? 0,
      }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);
    } else {
      // donut por SUB-actividad + seriesByUrl
      donut = Array.from(bySubCurrent.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      const xKeyList = curKeys; // ya alineadas a xLabels
      seriesByUrl = Array.from(urlDailyCurrent.entries()).map(
        ([path, dict]) => ({
          name: path,
          data: xKeyList.map((k) => dict.get(k) ?? 0),
          path,
        })
      );
    }
    return NextResponse.json(
      {
        granularity: g,
        range: { current, previous },
        property,
        id: townId,
        title: TOWN_META[townId].label,
        series,
        xLabels,
        donutData: donut,
        donut,
        deltaPct,
        seriesByUrl,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
