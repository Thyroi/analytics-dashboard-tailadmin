import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse, type NextRequest } from "next/server";

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

/* ====================== opciones de despliegue ====================== */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ====================== helpers ====================== */
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
function pageRegexForCategory(id: CategoryId): string {
  const label = CATEGORY_META[id].label;
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

/** Tokens por pueblo para clasificar urls → pueblo */
function tokensForTown(id: TownId): string[] {
  const base = TOWN_META[id].label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const byId = id.toLowerCase();
  const kebab = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = base.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([kebab, compact, byId].filter(Boolean)));
}

/** Donut por pueblos dentro del rango current (soporta date/yearMonth) */
function donutByTownsFlexible(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  timeDim: "date" | "yearMonth",
  currentKeys: string[] // YYYY-MM-DD (date) o YYYYMM (yearMonth)
): DonutDatum[] {
  const rr = rows ?? [];
  const currentSet = new Set(currentKeys);
  const totals = new Map<string, number>(); // label → total

  const townTokens: Array<{ id: TownId; tokens: string[]; label: string }> =
    TOWN_ID_ORDER.map((tid) => ({
      id: tid,
      tokens: tokensForTown(tid),
      label: TOWN_META[tid].label,
    }));

  for (const r of rr) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];
    const slotRaw = String(dims[0]?.value ?? "");
    const url = String(dims[1]?.value ?? "");
    const path = safePathname(url).toLowerCase();
    const val = Number(mets[0]?.value ?? 0);

    // key del slot
    let key: string | null = null;
    if (timeDim === "date") {
      if (slotRaw.length === 8) {
        key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
          6,
          8
        )}`;
      }
    } else {
      if (slotRaw.length === 6) key = slotRaw; // YYYYMM
    }
    if (!key || !currentSet.has(key)) continue;

    for (const t of townTokens) {
      const hit = t.tokens.some(
        (tok) =>
          path.includes(`/${tok}/`) ||
          path.endsWith(`/${tok}`) ||
          path.includes(`-${tok}-`) ||
          path.includes(`_${tok}_`) ||
          path.includes(tok)
      );
      if (hit) {
        totals.set(t.label, (totals.get(t.label) ?? 0) + val);
        break;
      }
    }
  }

  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ====================== handler ====================== */
export async function GET(req: NextRequest, ctx: unknown) {
  try {
    const { id } = (ctx as { params: { id: string } }).params;

    if (!(CATEGORY_ID_ORDER as readonly string[]).includes(id)) {
      return NextResponse.json(
        { error: `CategoryId inválido: ${id}` },
        { status: 400 }
      );
    }
    const catId = id as CategoryId;

    const url = new URL(req.url);
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    // Rango que TERMINA AYER; para 'd' queremos 7 días (serie) → dayAsWeek=true
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveRangeEndingYesterday(g, now, g === "d");
    const prevPreset = prevComparable(currPreset);

    const ranges = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // Eje temporal alineado (d/w/m por día, y por mes)
    const axis = buildAxisForGranularity(g, ranges);
    const timeDim = axis.dimensionTime; // "date" | "yearMonth"

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Un request (prev+curr) con filtro page_view + regex de la categoría
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [
        { startDate: ranges.previous.start, endDate: ranges.current.end },
      ],
      metrics: [{ name: "eventCount" }],
      dimensions: [
        { name: timeDim },
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
                  value: pageRegexForCategory(catId),
                  caseSensitive: false,
                },
              },
            },
          ],
        },
      },
      orderBys: [{ dimension: { dimensionName: timeDim } }],
      keepEmptyRows: false,
      limit: "200000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // Vectores current/previous pre-llenados a 0
    const curVec = Array(axis.curKeys.length).fill(0);
    const prevVec = Array(axis.prevKeys.length).fill(0);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const slotRaw = String(dims[0]?.value ?? "");
      const v = Number(mets[0]?.value ?? 0);

      let key: string | null = null;
      if (timeDim === "date") {
        if (slotRaw.length === 8) {
          key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
            6,
            8
          )}`;
        }
      } else {
        if (slotRaw.length === 6) key = slotRaw; // YYYYMM
      }
      if (!key) continue;

      const iCur = axis.indexByCurKey.get(key);
      if (iCur !== undefined) {
        curVec[iCur] += v;
        continue;
      }
      const iPrev = axis.indexByPrevKey.get(key);
      if (iPrev !== undefined) {
        prevVec[iPrev] += v;
      }
    }

    // --- SERIESPOINTS con labels correctos para current y previous ---
    const prevLabelsRaw =
      timeDim === "date"
        ? axis.prevKeys // YYYY-MM-DD
        : axis.prevKeys.map((k) => `${k.slice(0, 4)}-${k.slice(4, 6)}`); // YYYYMM → YYYY-MM
    const curLabels = axis.xLabels;

    const n = Math.min(
      curLabels.length,
      prevLabelsRaw.length,
      curVec.length,
      prevVec.length
    );

    const series: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: curLabels
        .slice(0, n)
        .map((lab, i) => ({ label: lab, value: curVec[i] ?? 0 })),
      previous: prevLabelsRaw
        .slice(0, n)
        .map((lab, i) => ({ label: lab, value: prevVec[i] ?? 0 })),
    };

    // Donut por pueblos (solo current)
    const donutData: DonutDatum[] = donutByTownsFlexible(
      rows,
      timeDim,
      timeDim === "date" ? axis.curKeys : axis.curKeys
    );

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        property,
        id: catId,
        title: CATEGORY_META[catId].label,
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
