import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { Granularity } from "@/lib/types";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  todayUTC,
  deriveAutoRangeForGranularity,
  prevComparable,
} from "@/lib/utils/datetime";

/* ====================== helpers fecha/rango ====================== */
type DateRange = { start: string; end: string };

function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/* ====================== towns regex tokens ====================== */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function buildFullRegexForTowns(towns: TownId[]): string {
  const host = "^https?://[^/]+";
  const alts: string[] = [];

  for (const id of towns) {
    const toks = tokensForTown(id).map(escapeRe);
    // Coincidimos como segmento, sufijo, entre guiones/guiones bajos, o texto plano.
    alts.push(
      `(?:/(?:${toks.join("|")})(?:/|$)|[-_](?:${toks.join("|")})[-_]|${toks.join("|")})`
    );
  }

  return `${host}.*(?:${alts.join("|")}).*`;
}

function safePathname(raw: string): string {
  try {
    return new URL(raw).pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

function classifyTownByPath(path: string, towns: TownId[]): TownId | null {
  const lc = path.toLowerCase();
  for (const id of towns) {
    const toks = tokensForTown(id);
    const hit = toks.some(
      (t) =>
        lc.includes(`/${t}/`) ||
        lc.endsWith(`/${t}`) ||
        lc.includes(`-${t}-`) ||
        lc.includes(`_${t}_`) ||
        lc.includes(t)
    );
    if (hit) return id;
  }
  return null;
}

/* ====================== handler ====================== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const endISO = searchParams.get("end") || undefined;

    // Rango actual + comparable usando utils/datetime
    const now = endISO ? parseISO(endISO) : todayUTC();
    const currPreset = deriveAutoRangeForGranularity(g, now); // {startTime,endTime}
    const prevPreset = prevComparable(currPreset);

    const ranges: { current: DateRange; previous: DateRange } = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    const towns: TownId[] = [...TOWN_ID_ORDER];

    // GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Un solo request: unión prev+curr + filtro por page_view y regex de pueblos
    const reqAll: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: ranges.previous.start, endDate: ranges.current.end }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "date" }, { name: "pageLocation" }, { name: "eventName" }],
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
                  value: buildFullRegexForTowns(towns),
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

    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: reqAll,
    });

    const rows = resp.data.rows ?? [];

    const currTotals: Record<TownId, number> = Object.fromEntries(
      towns.map((t) => [t, 0])
    ) as Record<TownId, number>;

    const prevTotals: Record<TownId, number> = Object.fromEntries(
      towns.map((t) => [t, 0])
    ) as Record<TownId, number>;

    for (const r of rows) {
      const dateRaw = String(r.dimensionValues?.[0]?.value ?? ""); // YYYYMMDD
      if (dateRaw.length !== 8) continue;

      const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
      const url = String(r.dimensionValues?.[1]?.value ?? "");
      const path = safePathname(url);
      const val = Number(r.metricValues?.[0]?.value ?? 0);

      const town = classifyTownByPath(path, towns);
      if (!town) continue;

      if (iso >= ranges.current.start && iso <= ranges.current.end) {
        currTotals[town] += val;
      } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
        prevTotals[town] += val;
      }
    }

    const perTown: Record<
      TownId,
      { currentTotal: number; previousTotal: number; deltaPct: number }
    > = {} as Record<
      TownId,
      { currentTotal: number; previousTotal: number; deltaPct: number }
    >;

    for (const t of towns) {
      const c = currTotals[t] ?? 0;
      const p = prevTotals[t] ?? 0;
      perTown[t] = { currentTotal: c, previousTotal: p, deltaPct: pctDelta(c, p) };
    }

    return NextResponse.json(
      {
        granularity: g,
        range: ranges,
        property,
        towns,
        perTown,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
