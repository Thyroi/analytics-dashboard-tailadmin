// src/app/api/analytics/v1/dimensions/pueblos/totals/route.ts
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import { buildUnionRunReportRequest } from "@/lib/utils/ga4Requests";
import {
  computeDeltaPct,
  computeRangesFromQuery,
  safeUrlPathname,
} from "@/lib/utils/timeWindows";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";

/* =========== helpers towns/regex =========== */
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
    alts.push(
      `(?:/(?:${toks.join("|")})(?:/|$)|[-_](?:${toks.join(
        "|"
      )})[-_]|${toks.join("|")})`
    );
  }
  return `${host}.*(?:${alts.join("|")}).*`;
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

/* =========== handler =========== */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d") as Granularity;
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");

    const ranges = computeRangesFromQuery(g, startQ, endQ);
    const towns: TownId[] = [...TOWN_ID_ORDER];

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Unión prev.start → curr.end + filtros: page_view + regex pueblos
    const requestBody = buildUnionRunReportRequest({
      current: ranges.current,
      previous: ranges.previous,
      metrics: [{ name: "eventCount" }],
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
                  value: buildFullRegexForTowns(towns),
                  caseSensitive: false,
                },
              },
            },
          ],
        },
      },
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
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

      const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(
        4,
        6
      )}-${dateRaw.slice(6, 8)}`;
      const url = String(r.dimensionValues?.[1]?.value ?? "");
      const path = safeUrlPathname(url);
      const val = Number(r.metricValues?.[0]?.value ?? 0);

      const town = classifyTownByPath(path, towns);
      if (!town) continue;

      if (iso >= ranges.current.start && iso <= ranges.current.end) {
        currTotals[town] += val;
      } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
        prevTotals[town] += val;
      }
    }

    const items = towns.map((id) => {
      const c = currTotals[id] ?? 0;
      const p = prevTotals[id] ?? 0;
      return {
        id,
        currentTotal: c,
        previousTotal: p,
        deltaPct: computeDeltaPct(c, p),
      };
    });

    return NextResponse.json(
      {
        granularity: g,
        range: ranges, // { current: {start,end}, previous: {start,end} }
        property,
        items,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
