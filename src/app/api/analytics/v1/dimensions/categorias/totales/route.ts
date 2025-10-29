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
} from "@/lib/utils/analytics/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/analytics/ga4Requests";
import {
  matchCategoryIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import { calculatePreviousPeriodOnly } from "@/lib/utils/time/rangeCalculations";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { google } from "googleapis";
import { NextResponse } from "next/server";

/* -------- handler con nueva lógica de rangos -------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startQ = searchParams.get("startDate");
    const endQ = searchParams.get("endDate");
    const granularityOverride = searchParams.get(
      "granularity"
    ) as Granularity | null;

    // Validar que tenemos fechas requeridas
    if (!startQ || !endQ) {
      return NextResponse.json(
        {
          error: "Missing required parameters: startDate and endDate",
        },
        { status: 400 }
      );
    }

    // Calcular solo rangos (sin granularidad automática para totales)
    const calculation = calculatePreviousPeriodOnly(startQ, endQ);

    // Para totales: usar granularidad override o default 'd' (no auto-calcular)
    const finalGranularity = granularityOverride || "d";

    const ranges = {
      current: calculation.currentRange,
      previous: calculation.prevRange,
    };

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usar helper común para page_view requests (pasar granularidad UI para decidir dimensiones)
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: finalGranularity, // ✅ Para totales también necesitamos elegir dimensiones correctas
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

    // Procesar filas con soporte para yearMonth (6 dígitos) y date (8 dígitos)
    for (const r of rows) {
      const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");

      // Convertir a formato ISO según longitud
      let iso: string;
      if (dateRaw.length === 8) {
        // date dimension: YYYYMMDD
        iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
          6,
          8
        )}`;
      } else if (dateRaw.length === 6) {
        // yearMonth dimension: YYYYMM → usar primer día del mes
        iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-01`;
      } else {
        continue; // Formato desconocido, saltar
      }

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

    // Crear items usando los títulos de la taxonomía (excluir "otros")
    const items = CATEGORY_ID_ORDER.filter((id) => id !== "otros").map((id) => {
      const curr = currentTotals[id] ?? 0;
      const prev = previousTotals[id] ?? 0;
      return {
        id,
        title: getCategoryLabel(id), // Usa el título oficial de la taxonomía
        total: curr,
        previousTotal: prev, // ✨ NUEVO: agregar valor anterior
        deltaPct: computeDeltaPct(curr, prev),
      };
    });

    return NextResponse.json(
      {
        success: true,
        calculation: {
          requestedGranularity: finalGranularity,
          finalGranularity,
          granularityReason: granularityOverride
            ? "overridden by query param"
            : "default daily granularity",
          currentPeriod: {
            start: ranges.current.start,
            end: ranges.current.end,
          },
          previousPeriod: {
            start: ranges.previous.start,
            end: ranges.previous.end,
          },
        },
        data: {
          property,
          items,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
