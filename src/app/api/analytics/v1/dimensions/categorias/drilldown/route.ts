import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import type { Granularity, DonutDatum, SeriesPoint } from "@/lib/types";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveRangeEndingYesterday,
  prevComparable,
} from "@/lib/utils/datetime";
import { normalizePath, stripLangPrefix } from "@/lib/utils/url";
import { buildAxisForGranularity } from "@/lib/utils/timeAxis";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import {
  TOWN_ID_ORDER,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";

/* ------------- helpers ------------- */

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function normToken(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** path → {categoryId, townId?, sub?} muy permisivo */
function parseCategoryTownSub(path: string): { categoryId?: CategoryId; townId?: TownId; sub?: string } {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) return {};
  const segs = clean.split("/").map(normToken);

  // categoría: el primer seg que pertenezca a CATEGORY_ID_ORDER o coincida con el label normalizado
  let categoryId: CategoryId | undefined;
  for (const seg of segs) {
    if ((CATEGORY_ID_ORDER as readonly string[]).includes(seg)) {
      categoryId = seg as CategoryId;
      break;
    }
    // coincidencia por label normalizado
    for (const c of CATEGORY_ID_ORDER) {
      const lbl = CATEGORY_META[c].label;
      const normLbl = normToken(lbl);
      if (seg === normLbl) { categoryId = c; break; }
    }
    if (categoryId) break;
  }
  if (!categoryId) return {};

  // town (si viene) inmediatamente después
  const catIdx = segs.findIndex(
    (s) => s === categoryId || s === normToken(CATEGORY_META[categoryId].label)
  );
  const townSeg = segs[catIdx + 1];
  const townId = townSeg && (TOWN_ID_ORDER as readonly string[]).includes(townSeg) ? (townSeg as TownId) : undefined;

  // sub (si hay)
  const sub = segs[catIdx + 2];

  return { categoryId, townId, sub };
}

/* ------------- handler ------------- */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;
    const categoryId = (searchParams.get("categoryId") || "").trim() as CategoryId;
    const townIdParam = (searchParams.get("townId") || "").trim() as TownId | "";

    if (!CATEGORY_ID_ORDER.includes(categoryId)) {
      return NextResponse.json({ error: `Invalid categoryId '${categoryId}'` }, { status: 400 });
    }
    if (townIdParam && !(TOWN_ID_ORDER as readonly string[]).includes(townIdParam)) {
      return NextResponse.json({ error: `Invalid townId '${townIdParam}'` }, { status: 400 });
    }

    // Rango actual y comparable (terminando AYER) — para 'd' queremos 7 días
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveRangeEndingYesterday(g, now, g === "d");
    const prevPreset = prevComparable(currPreset);
    const ranges = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // EJE
    const axis = buildAxisForGranularity(g, ranges);
    const N = axis.xLabels.length;

    // GA
    const auth: GoogleAuth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.previous.start, endDate: ranges.current.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: axis.dimensionTime }, { name: "pageLocation" }, { name: "eventName" }],
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

    const currVec = Array(N).fill(0) as number[];
    const prevVec = Array(N).fill(0) as number[];

    // donut:
    // - sin townId => por pueblos
    // - con townId => por sub-actividad (slugs) dentro de esa categoría y pueblo
    const byTownCurrent = new Map<TownId, number>();
    const bySubCurrent = new Map<string, number>();

    // series por URL (solo cuando hay townId)
    const urlVecs = new Map<string, number[]>();

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const slotRaw = String(dims[0]?.value ?? "");
      const locRaw = String(dims[1]?.value ?? "");
      const events = Number(mets[0]?.value ?? 0);

      let slotKey: string | null = null;
      if (axis.dimensionTime === "date") {
        if (slotRaw.length === 8) {
          slotKey = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(6, 8)}`;
        }
      } else {
        if (slotRaw.length === 6) slotKey = slotRaw; // YYYYMM
      }
      if (!slotKey) continue;

      const { path } = stripLangPrefix(normalizePath(locRaw));
      const parsed = parseCategoryTownSub(path);
      if (parsed.categoryId !== categoryId) continue;

      const iCur = axis.indexByCurKey.get(slotKey);
      const iPrev = axis.indexByPrevKey.get(slotKey);
      if (iCur !== undefined) currVec[iCur] += events;
      else if (iPrev !== undefined) prevVec[iPrev] += events;
      else continue;

      if (iCur === undefined) continue; // solo current alimenta donut/seriesByUrl

      if (!townIdParam) {
        // donut por pueblos
        const t = parsed.townId;
        if (t) byTownCurrent.set(t, (byTownCurrent.get(t) ?? 0) + events);
      } else {
        // centrado en un pueblo concreto
        if (parsed.townId !== townIdParam) continue;

        // sub (o base /cat/town/)
        const clean = path.replace(/^\/+|\/+$/g, "");
        const segs = clean.split("/");
        // buscamos la posición del town dentro del path para cortar hasta sub
        const townIdx = segs.findIndex((s) => normToken(s) === townIdParam);
        const sub = segs[townIdx + 2] ? segs[townIdx + 2] : `${categoryId}/${townIdParam}`;
        bySubCurrent.set(sub, (bySubCurrent.get(sub) ?? 0) + events);

        const url = "/" + segs.slice(0, townIdx + 3).join("/") + "/";
        if (!urlVecs.has(url)) urlVecs.set(url, Array(N).fill(0));
        urlVecs.get(url)![iCur] += events;
      }
    }

    const series: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: axis.xLabels.map((label, i) => ({ label, value: currVec[i] ?? 0 })),
      previous: axis.xLabels.map((label, i) => ({ label, value: prevVec[i] ?? 0 })),
    };
    const totals = {
      current: currVec.reduce((a, b) => a + b, 0),
      previous: prevVec.reduce((a, b) => a + b, 0),
    };

    if (!townIdParam) {
      const donut: DonutDatum[] = TOWN_ID_ORDER
        .map((tid) => ({ label: TOWN_META[tid].label, value: byTownCurrent.get(tid) ?? 0 }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);

      return NextResponse.json(
        {
          granularity: g,
          range: ranges,
          context: { categoryId },
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

    const seriesByUrl = Array.from(urlVecs.entries()).map(([url, data]) => ({
      name: url,
      data,
      path: url,
    }));

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        context: { categoryId, townId: townIdParam },
        series,
        xLabels: axis.xLabels,
        donut,
        deltaPct: pctDelta(totals.current, totals.previous),
        seriesByUrl,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
