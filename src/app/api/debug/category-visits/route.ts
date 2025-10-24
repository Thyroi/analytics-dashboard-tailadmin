/**
 * /api/debug/category-visits/route.ts
 * Endpoint para debuggear visitas específicas de una categoría en una fecha
 */

import { getCategoryLabel, type CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/analytics/ga4Requests";
import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") as CategoryId;
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!categoryId || !date) {
      return NextResponse.json(
        { error: "Missing categoryId or date parameters" },
        { status: 400 }
      );
    }

    // Configurar GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Hacer query para el día específico
    const requestBody = buildPageViewUnionRequest({
      current: { start: date, end: date },
      previous: { start: date, end: date }, // No necesitamos previous para debug
      granularity: "d" as Granularity,
      metrics: [{ name: "eventCount" }],
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    // Procesar todas las filas y clasificarlas
    const visits: Array<{
      date: string;
      url: string;
      path: string;
      value: number;
      matchedCategory: string | null;
      matchedTown: string | null;
      isTargetCategory: boolean;
      reason: string;
    }> = [];

    let totalVisits = 0;
    let categoryVisits = 0;
    let townClassifiedVisits = 0;
    let unclassifiedVisits = 0;

    const townBreakdown: Record<string, number> = {};

    for (const row of rows) {
      const dateRaw = String(row.dimensionValues?.[0]?.value ?? "");
      const url = String(row.dimensionValues?.[1]?.value ?? "");
      const value = Number(row.metricValues?.[0]?.value ?? 0);

      // Convertir fecha de YYYYMMDD a YYYY-MM-DD
      const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(
        4,
        6
      )}-${dateRaw.slice(6, 8)}`;

      if (iso !== date) continue; // Solo el día que nos interesa

      totalVisits += value;

      const path = safeUrlPathname(url);
      const matchedCategory = matchCategoryIdFromPath(path);
      const matchedTown = matchTownIdFromPath(path);

      const isTargetCategory = matchedCategory === categoryId;

      let reason = "";
      if (isTargetCategory) {
        categoryVisits += value;

        if (matchedTown) {
          townClassifiedVisits += value;
          townBreakdown[matchedTown] =
            (townBreakdown[matchedTown] || 0) + value;
          reason = `✅ Classified as ${categoryId} + ${matchedTown}`;
        } else {
          unclassifiedVisits += value;
          reason = `⚠️ Matched ${categoryId} but NO TOWN detected`;
        }
      } else {
        reason = `❌ Not ${categoryId} (matched: ${matchedCategory || "none"})`;
      }

      visits.push({
        date: iso,
        url: url,
        path: path,
        value: value,
        matchedCategory,
        matchedTown,
        isTargetCategory,
        reason,
      });
    }

    return NextResponse.json({
      debug: {
        categoryId,
        categoryLabel: getCategoryLabel(categoryId),
        date,
        query: {
          property,
          dateRange: `${date} → ${date}`,
        },
      },
      summary: {
        totalVisits,
        categoryVisits,
        townClassifiedVisits,
        unclassifiedVisits,
        discrepancy: categoryVisits - townClassifiedVisits,
        townBreakdown,
      },
      analysis: {
        seriesTotal: categoryVisits, // Lo que debería mostrar la serie
        donutTotal: townClassifiedVisits, // Lo que muestra el donut
        missing: unclassifiedVisits, // Visitas que no se clasifican en pueblos
        explanation:
          unclassifiedVisits > 0
            ? `${unclassifiedVisits} visits matched ${categoryId} but couldn't be classified into towns`
            : "All category visits were properly classified into towns",
      },
      visits: visits
        .filter((v) => v.isTargetCategory) // Solo mostrar visitas de la categoría
        .sort((a, b) => b.value - a.value), // Ordenar por valor descendente
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error en debug category visits:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
