// src/app/api/analytics/v1/dimensions/categorias/totals/route.ts
import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { Granularity } from "@/lib/types";

import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  parseISO,
  prevComparable,
  deriveRangeEndingYesterday,
} from "@/lib/utils/datetime";

/** ========= Taxonomía mínima (id -> posibles slugs en URL) =========
 *  Ajusta/añade si detectas más variantes en tus paths.
 */
const CATEGORY_SLUGS: Record<string, string[]> = {
  circuitoMonteblanco: ["circuito-monteblanco", "monteblanco"],
  donana: ["donana", "doñana"],
  espaciosMuseisticos: ["espacios-museisticos", "museos", "museistics", "museistics-es"],
  fiestasTradiciones: ["fiestas-tradiciones", "festivals-and-traditions", "fiestas"],
  laRabida: ["la-rabida", "rabida"],
  lugaresColombinos: ["lugares-colombinos", "colombinos"],
  naturaleza: ["naturaleza", "nature"],
  patrimonio: ["patrimonio", "heritage"],
  playa: ["playa", "playas", "beaches", "beach"],
  rutasCulturales: ["rutas-culturales", "cultural-routes"],
  rutasSenderismo: ["rutas-senderismo", "senderismo", "btt", "vias-verdes", "hiking", "cicloturistas"],
  sabor: ["sabor", "taste", "gastronomia", "food"],
};
type CategoryId = keyof typeof CATEGORY_SLUGS;

/* -------- utils URL -------- */
function safeUrlPathname(raw: string): string {
  try {
    const u = new URL(raw);
    return u.pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}
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

/* -------- tipos y helpers -------- */
type Totals = { currentTotal: number; previousTotal: number; deltaPct: number | null };
type TotalsMap = Record<CategoryId, Totals>;

function emptyTotals(): TotalsMap {
  const out = {} as TotalsMap;
  (Object.keys(CATEGORY_SLUGS) as CategoryId[]).forEach((k) => {
    out[k] = { currentTotal: 0, previousTotal: 0, deltaPct: null };
  });
  return out;
}
function computeDeltaPct(curr: number, prev: number): number | null {
  // Sin base de comparación => null (para que el front muestre "Sin datos suficientes")
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

/* -------- handler -------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gParam = (searchParams.get("g") || "d").trim().toLowerCase() as Granularity;
    const endISO = (searchParams.get("end") || "").trim() || undefined;

    // Rango actual: ventana que TERMINA AYER (opcionalmente anclada a 'endISO')
    const currPreset = endISO
      ? deriveRangeEndingYesterday(gParam, parseISO(endISO))
      : deriveRangeEndingYesterday(gParam);
    const prevPreset = prevComparable(currPreset);

    const windows = {
      current: { start: currPreset.startTime, end: currPreset.endTime },
      previous: { start: prevPreset.startTime, end: prevPreset.endTime },
    };

    // GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const propertyName = normalizePropertyId(resolvePropertyId());

    // Current
    const reqCurrent: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: windows.current.start, endDate: windows.current.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "eventName" }, { name: "pageLocation" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
        },
      },
      keepEmptyRows: false,
      limit: "100000",
    };
    // Previous
    const reqPrevious: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: windows.previous.start, endDate: windows.previous.end }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "eventName" }, { name: "pageLocation" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "page_view", caseSensitive: false },
        },
      },
      keepEmptyRows: false,
      limit: "100000",
    };

    const [resCur, resPrev] = await Promise.all([
      analyticsData.properties.runReport({ property: propertyName, requestBody: reqCurrent }),
      analyticsData.properties.runReport({ property: propertyName, requestBody: reqPrevious }),
    ]);

    const curRows = resCur.data.rows ?? [];
    const prevRows = resPrev.data.rows ?? [];

    const totals = emptyTotals();

    // agrega current
    for (const r of curRows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const path = safeUrlPathname(String(dims[1]?.value ?? ""));
      const evCount = Number(mets[0]?.value ?? 0);
      const cat = matchCategoryIdFromPath(path);
      if (cat) totals[cat].currentTotal += evCount;
    }
    // agrega previous
    for (const r of prevRows) {
      const dims = r.dimensionValues ?? [];
      const mets = r.metricValues ?? [];
      const path = safeUrlPathname(String(dims[1]?.value ?? ""));
      const evCount = Number(mets[0]?.value ?? 0);
      const cat = matchCategoryIdFromPath(path);
      if (cat) totals[cat].previousTotal += evCount;
    }
    // delta por categoría
    (Object.keys(CATEGORY_SLUGS) as CategoryId[]).forEach((cat) => {
      totals[cat].deltaPct = computeDeltaPct(
        totals[cat].currentTotal,
        totals[cat].previousTotal
      );
    });

    return NextResponse.json(
      {
        granularity: gParam,
        range: windows,
        property: propertyName,
        categories: Object.keys(CATEGORY_SLUGS), // orden estable
        perCategory: totals,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
