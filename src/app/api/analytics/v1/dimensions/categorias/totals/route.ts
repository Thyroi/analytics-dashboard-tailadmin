// src/app/api/analytics/v1/dimensions/categorias/totals/route.ts
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

/** ========= Taxonomía mínima (id -> posibles slugs en URL) ========= */
const CATEGORY_SLUGS: Record<string, string[]> = {
  circuitoMonteblanco: ["circuito-monteblanco", "monteblanco"],
  donana: ["donana", "doñana"],
  espaciosMuseisticos: [
    "espacios-museisticos",
    "museos",
    "museistics",
    "museistics-es",
  ],
  fiestasTradiciones: [
    "fiestas-tradiciones",
    "festivals-and-traditions",
    "fiestas",
  ],
  laRabida: ["la-rabida", "rabida"],
  lugaresColombinos: ["lugares-colombinos", "colombinos"],
  naturaleza: ["naturaleza", "nature"],
  patrimonio: ["patrimonio", "heritage"],
  playa: ["playa", "playas", "beaches", "beach"],
  rutasCulturales: ["rutas-culturales", "cultural-routes"],
  rutasSenderismo: [
    "rutas-senderismo",
    "senderismo",
    "btt",
    "vias-verdes",
    "hiking",
    "cicloturistas",
  ],
  sabor: ["sabor", "taste", "gastronomia", "food"],
};
type CategoryId = keyof typeof CATEGORY_SLUGS;

/* -------- matching por path -------- */
function matchCategoryIdFromPath(path: string): CategoryId | null {
  const lc = path.toLowerCase();
  for (const [catId, slugs] of Object.entries(CATEGORY_SLUGS)) {
    if (
      slugs.some(
        (s) =>
          lc.includes(`/${s}/`) ||
          lc.endsWith(`/${s}`) ||
          lc.includes(`-${s}-`) ||
          lc.includes(`_${s}_`)
      )
    ) {
      return catId as CategoryId;
    }
  }
  return null;
}

/* -------- handler -------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d")
      .trim()
      .toLowerCase() as Granularity;
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");

    // Rangos con política (desplazamiento con solape)
    const ranges = computeRangesFromQuery(g, startQ, endQ);

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Unión prev.start → curr.end + filtro page_view
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
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "page_view",
            caseSensitive: false,
          },
        },
      },
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    const currentTotals: Record<CategoryId, number> = Object.fromEntries(
      (Object.keys(CATEGORY_SLUGS) as CategoryId[]).map((k) => [k, 0])
    ) as Record<CategoryId, number>;
    const previousTotals: Record<CategoryId, number> = Object.fromEntries(
      (Object.keys(CATEGORY_SLUGS) as CategoryId[]).map((k) => [k, 0])
    ) as Record<CategoryId, number>;

    for (const r of rows) {
      const dateRaw = String(r.dimensionValues?.[0]?.value ?? ""); // YYYYMMDD
      if (dateRaw.length !== 8) continue;
      const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(
        4,
        6
      )}-${dateRaw.slice(6, 8)}`;

      const url = String(r.dimensionValues?.[1]?.value ?? "");
      const path = safeUrlPathname(url);
      const value = Number(r.metricValues?.[0]?.value ?? 0);

      const cat = matchCategoryIdFromPath(path);
      if (!cat) continue;

      if (iso >= ranges.current.start && iso <= ranges.current.end) {
        currentTotals[cat] += value;
      } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
        previousTotals[cat] += value;
      }
    }

    const items = (Object.keys(CATEGORY_SLUGS) as CategoryId[]).map((id) => {
      const curr = currentTotals[id] ?? 0;
      const prev = previousTotals[id] ?? 0;
      return {
        id,
        title: id,
        total: curr,
        deltaPct: computeDeltaPct(curr, prev),
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
