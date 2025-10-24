/**
 * /api/debug/fechas/route.ts
 * Debug endpoint para probar cálculo de fechas basado en categorías totales
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
} from "@/lib/utils/analytics/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/analytics/ga4Requests";
import {
  matchCategoryIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { google } from "googleapis";
import { NextResponse } from "next/server";

/* -------- handler debug -------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");
    const granularityOverride = searchParams.get(
      "granularity"
    ) as Granularity | null;

    // Debug info - parámetros recibidos
    const debugParams = {
      receivedParams: {
        start: startQ,
        end: endQ,
        granularity: granularityOverride,
      },
      timestamp: new Date().toISOString(),
    };

    // Validar que tenemos fechas
    if (!startQ || !endQ) {
      return NextResponse.json(
        {
          error: "Missing start or end date",
          debug: debugParams,
        },
        { status: 400 }
      );
    }

    // Calcular rangos usando la nueva función
    const calculation = calculatePreviousPeriodAndGranularity(startQ, endQ);

    // Si viene granularidad override, usarla
    const finalGranularity = granularityOverride || calculation.granularity;

    const ranges = {
      current: calculation.currentRange,
      previous: calculation.prevRange,
    };

    // Debug info - cálculos
    const debugCalculation = {
      originalGranularity: calculation.granularity,
      finalGranularity,
      durationDays: calculation.durationDays,
      ranges,
      granularityReason: granularityOverride
        ? "overridden by query param"
        : "calculated automatically",
    };

    // GA4 Query
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      metrics: [{ name: "eventCount" }],
    });

    // Debug info - GA4 request
    const debugGA4Request = {
      property,
      requestBody: JSON.parse(JSON.stringify(requestBody)), // Deep copy para debug
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    // Procesar datos (igual que el original)
    const currentTotals: Record<CategoryId, number> = Object.fromEntries(
      CATEGORY_ID_ORDER.map((k) => [k, 0])
    ) as Record<CategoryId, number>;
    const previousTotals: Record<CategoryId, number> = Object.fromEntries(
      CATEGORY_ID_ORDER.map((k) => [k, 0])
    ) as Record<CategoryId, number>;

    for (const r of rows) {
      const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
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

    const items = CATEGORY_ID_ORDER.map((id) => {
      const curr = currentTotals[id] ?? 0;
      const prev = previousTotals[id] ?? 0;
      return {
        id,
        title: getCategoryLabel(id),
        total: curr,
        previousTotal: prev,
        deltaPct: computeDeltaPct(curr, prev),
      };
    });

    // Debug info - respuesta GA4
    const debugGA4Response = {
      totalRows: rows.length,
      sampleResponse: rows.slice(0, 3), // Primeras 3 filas como muestra
      processedCategories: Object.keys(currentTotals).length,
    };

    // Respuesta completa con debug
    return NextResponse.json(
      {
        // Data normal
        granularity: finalGranularity,
        range: ranges,
        property,
        items,

        // Debug information
        debug: {
          params: debugParams,
          calculation: debugCalculation,
          ga4Request: debugGA4Request,
          ga4Response: debugGA4Response,
          summary: {
            totalCurrentEvents: Object.values(currentTotals).reduce(
              (a, b) => a + b,
              0
            ),
            totalPreviousEvents: Object.values(previousTotals).reduce(
              (a, b) => a + b,
              0
            ),
            categoriesWithData: items.filter((i) => i.total > 0).length,
          },
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: msg,
        debug: {
          timestamp: new Date().toISOString(),
          errorType: err instanceof Error ? err.constructor.name : "Unknown",
        },
      },
      { status: 500 }
    );
  }
}
