// src/app/api/analytics/v1/dimensions/pueblos/[id]/details/route.ts
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse, type NextRequest } from "next/server";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";

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

/* ====================== opciones de despliegue ====================== */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ====================== helpers ====================== */
function normBase(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
/** genera dos variantes útiles para matching en path: kebab y compact */
function explodeTokenForms(s: string): string[] {
  const base = normBase(s);
  const kebab = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = base.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([kebab, compact].filter(Boolean)));
}

function tokensForTown(id: TownId): string[] {
  const label = TOWN_META[id].label;
  return Array.from(
    new Set([...explodeTokenForms(label), ...explodeTokenForms(id)])
  );
}
function belongsToTown(pathname: string, townId: TownId): boolean {
  const lc = pathname.toLowerCase();
  const toks = tokensForTown(townId);
  return toks.some(
    (t) =>
      lc.includes(`/${t}/`) ||
      lc.endsWith(`/${t}`) ||
      lc.includes(`-${t}-`) ||
      lc.includes(`_${t}_`) ||
      lc.includes(t)
  );
}

/** tokens para categoría: label + id + SINÓNIMOS */
function tokensForCategory(id: CategoryId): string[] {
  const label = CATEGORY_META[id].label;
  const syns = CATEGORY_SYNONYMS[id] ?? [];
  const bases = [id, label, ...syns].filter(Boolean) as string[];
  const out = new Set<string>();
  for (const b of bases) {
    for (const t of explodeTokenForms(b)) out.add(t);
  }
  return Array.from(out);
}

/** Donut por categorías (solo current), con sinónimos y clasificación en código */
function donutByCategoriesFlexible(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  timeDim: "date" | "yearMonth",
  currentKeys: string[],
  townId: TownId
): DonutDatum[] {
  const rr = rows ?? [];
  const currentSet = new Set(currentKeys);
  const totals = new Map<string, number>(); // label → total

  const cats = CATEGORY_ID_ORDER.map((cid) => ({
    id: cid,
    label: CATEGORY_META[cid].label,
    tokens: tokensForCategory(cid),
  }));

  for (const r of rr) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];

    const slotRaw = String(dims[0]?.value ?? "");
    let key: string | null = null;
    if (timeDim === "date") {
      if (slotRaw.length === 8)
        key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
          6,
          8
        )}`;
    } else {
      if (slotRaw.length === 6) key = slotRaw; // YYYYMM
    }
    if (!key || !currentSet.has(key)) continue;

    const loc = String(dims[1]?.value ?? "");
    const { path } = stripLangPrefix(normalizePath(loc));
    if (!belongsToTown(path, townId)) continue;

    const val = Number(mets[0]?.value ?? 0);
    const p = path.toLowerCase();

    // clasificar por categoría usando tokens + sinónimos
    for (const c of cats) {
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
        totals.set(c.label, (totals.get(c.label) ?? 0) + val);
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

    if (!(TOWN_ID_ORDER as readonly string[]).includes(id)) {
      return NextResponse.json(
        { error: `TownId inválido: ${id}` },
        { status: 400 }
      );
    }
    const townId = id as TownId;

    const url = new URL(req.url);
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    // Rango que TERMINA AYER; para 'd' usamos 7 días (serie)
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveRangeEndingYesterday(g, now, g === "d");
    const prevPreset = prevComparable(currPreset);

    const ranges = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // Eje temporal (d/w/m → días, y → meses)
    const axis = buildAxisForGranularity(g, ranges);
    const timeDim = axis.dimensionTime;

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Traemos prev+curr, filtrando únicamente por eventName=page_view.
    // Pertenencia al pueblo y clasificación por categoría (con sinónimos) se hace en código.
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
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "page_view",
            caseSensitive: false,
          },
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

    // Vectores current/previous
    const curVec = Array(axis.curKeys.length).fill(0);
    const prevVec = Array(axis.prevKeys.length).fill(0);

    for (const r of rows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];

      const slotRaw = String(dims[0]?.value ?? "");
      const loc = String(dims[1]?.value ?? "");
      const { path } = stripLangPrefix(normalizePath(loc));
      if (!belongsToTown(path, townId)) continue;

      const v = Number(mets[0]?.value ?? 0);

      // key (date → YYYY-MM-DD, yearMonth → YYYYMM)
      let key: string | null = null;
      if (timeDim === "date") {
        if (slotRaw.length === 8) {
          key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
            6,
            8
          )}`;
        }
      } else {
        if (slotRaw.length === 6) key = slotRaw;
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

    // Etiquetas prev (formateadas) y construcción de series
    const prevLabelsRaw =
      timeDim === "date"
        ? axis.prevKeys
        : axis.prevKeys.map((k) => `${k.slice(0, 4)}-${k.slice(4, 6)}`);
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

    // Donut por categorías (solo current) con SINÓNIMOS
    const donutData: DonutDatum[] = donutByCategoriesFlexible(
      rows,
      timeDim,
      axis.curKeys,
      townId
    );

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        property,
        id: townId,
        title: TOWN_META[townId].label,
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
