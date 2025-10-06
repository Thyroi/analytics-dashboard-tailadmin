import { NextResponse, type NextRequest } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { Granularity } from "@/lib/types";
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

import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveRangeEndingYesterday,
  toISO,
  addDaysUTC,
} from "@/lib/utils/datetime";

/* ====================== tipos ====================== */
type DateRange = { start: string; end: string };

function toISODate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/* ============ helpers eje (current/previous alineados) ============ */
function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const end = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
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

/** previous = current desplazada -1 día */
function shiftRangeByDays(range: DateRange, days: number): DateRange {
  const s = addDaysUTC(parseISO(range.start), days);
  const e = addDaysUTC(parseISO(range.end), days);
  return { start: toISO(s), end: toISO(e) };
}

/* ====================== tokens / regex ====================== */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toTokens(baseLabel: string): string[] {
  const base = baseLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const kebab = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = base.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([kebab, compact].filter(Boolean)));
}
function pageRegexForTown(id: TownId): string {
  const label = TOWN_META[id].label;
  const alts = [...toTokens(label), id.toLowerCase()].map(escapeRe);
  const host = "^https?://[^/]+";
  const pathAlt = `(?:/(?:${alts.join("|")})(?:/|$)|[-_](?:${alts.join("|")})[-_]|${alts.join("|")})`;
  return `${host}.*${pathAlt}.*`;
}
function safePathname(raw: string): string {
  try {
    return new URL(raw).pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

/** donut por categorías (solo rango current) */
function donutByCategories(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  current: DateRange
) {
  const map: Record<string, number> = {};
  const rr = rows ?? [];
  const catTokens = CATEGORY_ID_ORDER.map((cid) => ({
    id: cid,
    label: CATEGORY_META[cid].label,
    tokens: Array.from(new Set([...toTokens(CATEGORY_META[cid].label), cid.toLowerCase()])),
  }));

  for (const r of rr) {
    const dRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (dRaw.length !== 8) continue;
    const iso = toISODate(dRaw);
    if (iso < current.start || iso > current.end) continue;

    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const p = safePathname(url).toLowerCase();
    const v = Number(r.metricValues?.[0]?.value ?? 0);

    for (const c of catTokens) {
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
        map[c.label] = (map[c.label] ?? 0) + v;
        break;
      }
    }
  }
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ====================== handler ====================== */
export async function GET(req: NextRequest, ctx: unknown) {
  try {
    const { id } = (ctx as { params: { id: string } }).params;
    if (!(TOWN_ID_ORDER as readonly string[]).includes(id)) {
      return NextResponse.json({ error: `TownId inválido: ${id}` }, { status: 400 });
    }
    const townId = id as TownId;

    const url = new URL(req.url);
    const g = (url.searchParams.get("g") || "d") as Granularity;
    const endISO = url.searchParams.get("end") || undefined;

    // current (termina ayer) — para 'd' usamos ventana de 7 días (series)
    const now = endISO ? parseISO(endISO) : todayUTC();
    const dayAsWeek = g === "d";
    const currPreset = deriveRangeEndingYesterday(g, now, dayAsWeek);
    const current: DateRange = { start: currPreset.startTime, end: currPreset.endTime };
    // previous = current desplazada -1 día (mismo largo)
    const previous: DateRange = shiftRangeByDays(current, -1);

    // Eje: d/w/m por días; y por meses
    let xLabels: string[] = [];
    let curKeys: string[] = [];
    let prevKeys: string[] = [];
    let curIndexByKey = new Map<string, number>();
    let prevIndexByKey = new Map<string, number>();
    const isYearly = g === "y";

    if (isYearly) {
      const { labels: curLabels, keys: curKs } = listLastNMonths(parseISO(current.end), 12);
      const { keys: prevKs } = listLastNMonths(parseISO(previous.end), 12);
      xLabels = curLabels;
      curKeys = curKs;
      prevKeys = prevKs;
      curIndexByKey = new Map(curKeys.map((k, i) => [k, i]));
      prevIndexByKey = new Map(prevKeys.map((k, i) => [k, i]));
    } else {
      xLabels = enumerateDaysUTC(current.start, current.end);
      const prevDays = enumerateDaysUTC(previous.start, previous.end);
      curKeys = xLabels; // YYYY-MM-DD
      prevKeys = prevDays;
      curIndexByKey = new Map(curKeys.map((k, i) => [k, i]));
      prevIndexByKey = new Map(prevKeys.map((k, i) => [k, i]));
    }

    // GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: previous.start, endDate: current.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "date" }, { name: "pageLocation" }, { name: "eventName" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "eventName",
                stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
              },
            },
            {
              filter: {
                fieldName: "pageLocation",
                stringFilter: {
                  matchType: "FULL_REGEXP",
                  value: pageRegexForTown(townId),
                  caseSensitive: false,
                },
              },
            },
          ],
        },
      },
      keepEmptyRows: false,
      limit: "200000",
    };

    const resp = await analytics.properties.runReport({ property, requestBody: request });
    const rows = resp.data.rows ?? [];

    // vectores
    const curVec = Array(curKeys.length).fill(0);
    const prevVec = Array(prevKeys.length).fill(0);

    for (const r of rows) {
      const dRaw = String(r.dimensionValues?.[0]?.value ?? "");
      if (dRaw.length !== 8) continue;
      const iso = toISODate(dRaw);
      const value = Number(r.metricValues?.[0]?.value ?? 0);

      const keyDay = iso;
      const keyMonth = dRaw.slice(0, 6); // YYYYMM

      const inCurrent = iso >= current.start && iso <= current.end;
      const inPrevious = iso >= previous.start && iso <= previous.end;

      // ⚠️ Dos IFs (no else-if) por ventanas solapadas
      if (inCurrent) {
        const k = isYearly ? keyMonth : keyDay;
        const idx = curIndexByKey.get(k);
        if (idx !== undefined) curVec[idx] += value;
      }
      if (inPrevious) {
        const k = isYearly ? keyMonth : keyDay;
        const idx = prevIndexByKey.get(k);
        if (idx !== undefined) prevVec[idx] += value;
      }
    }

    const series = {
      current: xLabels.map((lbl, i) => ({ label: lbl, value: curVec[i] ?? 0 })),
      previous: xLabels.map((lbl, i) => ({ label: lbl, value: prevVec[i] ?? 0 })),
    };

    // Donut: categorías sólo en current
    const donutData = donutByCategories(rows, current);

    return NextResponse.json(
      {
        granularity: g,
        range: { current, previous },
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
