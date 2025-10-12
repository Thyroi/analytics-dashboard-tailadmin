/**
 * /api/analytics/v1/dimensions/categorias/totales/route.ts
 * Endpoint EXACTO como el original pero usando taxonomía oficial
 */

import {
  type CategoryId,
  CATEGORY_ID_ORDER,
  getCategoryLabel,
} from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/ga4Requests";
import {
  matchCategoryIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/pathMatching";
import {
  computeDeltaPct,
  computeRangesFromQuery,
} from "@/lib/utils/timeWindows";
import { google } from "googleapis";
import { NextResponse } from "next/server";

/* -------- handler (EXACTO como el original) -------- */
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

    // Usar helper común para page_view requests
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      metrics: [{ name: "eventCount" }],
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    // Inicializar totales usando las categorías de la taxonomía
    const currentTotals: Record<CategoryId, number> = Object.fromEntries(
      CATEGORY_ID_ORDER.map((k) => [k, 0])
    ) as Record<CategoryId, number>;
    const previousTotals: Record<CategoryId, number> = Object.fromEntries(
      CATEGORY_ID_ORDER.map((k) => [k, 0])
    ) as Record<CategoryId, number>;

    // Procesar filas (EXACTO como el original)
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

    // Crear items usando los títulos de la taxonomía
    const items = CATEGORY_ID_ORDER.map((id) => {
      const curr = currentTotals[id] ?? 0;
      const prev = previousTotals[id] ?? 0;
      return {
        id,
        title: getCategoryLabel(id), // Usa el título oficial de la taxonomía
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
