import type { Granularity } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";

import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { normalizePath, stripLangPrefix } from "@/lib/utils/routing/url";
import {
  addDaysUTC,
  deriveRangeEndingYesterday,
  parseISO,
  todayUTC,
  toISO,
} from "@/lib/utils/time/datetime";

/* ---------------- tipos/helpers comunes ---------------- */
type DateRange = { start: string; end: string };

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

/* ---------- eje (labels, keys e índices alineados) ---------- */
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

/* ---------- sinónimos categoría ---------- */
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

/* ---------- parser de /town/cat/sub ---------- */
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

  const townId = segs[townIdx] as TownId;
  const catSeg = segs[townIdx + 1];
  const categoryId = catSeg ? SLUG2CAT[catSeg] : undefined;
  const subSlug = segs[townIdx + 2];

  return { townId, categoryId, subSlug };
}

/* ---------------- handler ---------------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;
    const categoryId = (
      searchParams.get("categoryId") || ""
    ).trim() as CategoryId;
    const townId = (searchParams.get("townId") || "").trim() as TownId | "";

    if (!CATEGORY_ID_ORDER.includes(categoryId)) {
      return NextResponse.json(
        { error: `Invalid categoryId '${categoryId}'` },
        { status: 400 }
      );
    }
    if (townId && !TOWN_ID_ORDER.includes(townId as TownId)) {
      return NextResponse.json(
        { error: `Invalid townId '${townId}'` },
        { status: 400 }
      );
    }

    // current termina AYER; para 'd' usamos 7 días (serie, no punto único)
    const now = endISO ? parseISO(endISO) : todayUTC();
    const dayAsWeek = g === "d";
    const cur = deriveRangeEndingYesterday(g, now, dayAsWeek);
    const current: DateRange = cur;
    // previous = current - 1 día
    const previous: DateRange = shiftRangeByDays(current, -1);

    // eje
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
      curKeys = xLabels;
      prevKeys = prevDays;
      curIndex = new Map(curKeys.map((k, i) => [k, i]));
      prevIndex = new Map(prevKeys.map((k, i) => [k, i]));
    }

    // GA
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

    // acumuladores
    const curVec = Array(curKeys.length).fill(0);
    const prevVec = Array(prevKeys.length).fill(0);

    // donut
    const donutTowns = new Map<TownId, number>(); // modo nivel 1 (sin townId)
    const donutSub = new Map<string, number>(); // modo nivel 2 (con townId)

    // seriesByUrl (solo cuando hay townId)
    const urlDaily = new Map<string, Map<string, number>>(); // url -> (key -> value)

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const dRaw = String(dims[0]?.value ?? "");
      if (dRaw.length !== 8) continue;

      const iso = toISODate(dRaw);
      const keyDay = iso;
      const keyMonth = dRaw.slice(0, 6); // YYYYMM

      const urlRaw = String(dims[1]?.value ?? "");
      const onlyPath = stripLangPrefix(normalizePath(urlRaw)).path;

      const v = Number(mets[0]?.value ?? 0);
      const inCur = iso >= current.start && iso <= current.end;
      const inPrev = iso >= previous.start && iso <= previous.end;

      // serie total
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

      // donuts/seriesByUrl solo en rango current
      if (!inCur) continue;

      const parsed = parseTownCatSub(onlyPath);
      if (!parsed.categoryId || parsed.categoryId !== categoryId) continue;

      if (!townId) {
        // nivel 1: donut por pueblos
        if (parsed.townId) {
          donutTowns.set(
            parsed.townId,
            (donutTowns.get(parsed.townId) ?? 0) + v
          );
        }
      } else {
        // nivel 2: mismo town (filtro), donut por sub-actividad + series por URL
        if (parsed.townId !== townId) continue;

        // sub = siguiente segmento o fallback a /town/cat/
        const clean = onlyPath.replace(/^\/+|\/+$/g, "");
        const segs = clean.split("/");
        const townIdx = segs.findIndex((s) => normToken(s) === townId);
        const sub = segs[townIdx + 2]
          ? segs[townIdx + 2]
          : `${townId}/${categoryId}`;
        donutSub.set(sub, (donutSub.get(sub) ?? 0) + v);

        // url base hasta sub
        const url = "/" + segs.slice(0, townIdx + 3).join("/") + "/";
        if (!urlDaily.has(url)) urlDaily.set(url, new Map<string, number>());
        const dict = urlDaily.get(url)!;
        const k = isYearly ? keyMonth : keyDay;
        dict.set(k, (dict.get(k) ?? 0) + v);
      }
    }

    // series y delta
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

    // donut
    let donut: Array<{ label: string; value: number }>;
    if (!townId) {
      donut = TOWN_ID_ORDER.map((tid) => ({
        label: TOWN_META[tid].label,
        value: donutTowns.get(tid) ?? 0,
      }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);
    } else {
      donut = Array.from(donutSub.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    }

    // seriesByUrl
    const xKeyList = isYearly ? curKeys /* YYYYMM */ : curKeys; /* YYYY-MM-DD */
    const seriesByUrl = townId
      ? Array.from(urlDaily.entries()).map(([path, dict]) => ({
          name: path,
          data: xKeyList.map((k) => dict.get(k) ?? 0),
          path,
        }))
      : [];

    return NextResponse.json(
      {
        granularity: g,
        range: { current, previous },
        context: { categoryId, ...(townId ? { townId } : {}) },
        series,
        xLabels,
        donut,
        deltaPct,
        seriesByUrl,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
