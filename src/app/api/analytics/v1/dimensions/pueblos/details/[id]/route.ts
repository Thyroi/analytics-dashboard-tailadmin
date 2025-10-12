/**
 * /api/analytics/v1/dimensions/pueblos/details/[id]/route.ts
 * Endpoint para obtener detalles de un pueblo específico (series + donut)
 */

import { TOWN_ID_ORDER, getTownLabel, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/ga4Requests";
import {
  formatSeriesWithGranularity,
  mapDataByGranularity,
  type GA4Row,
} from "@/lib/utils/granularityMapping";
import {
  computeCustomRanges,
  computeRangesByGranularity,
  debugRanges,
} from "@/lib/utils/granularityRanges";
import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/pathMatching";
import { buildCategoriesDonutForTown } from "@/lib/utils/seriesAndDonuts";
import { computeDeltaPct } from "@/lib/utils/timeWindows";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

/* -------- handler -------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validar que sea un pueblo válido
    if (!TOWN_ID_ORDER.includes(id as TownId)) {
      return NextResponse.json(
        { error: `Invalid townId '${id}'` },
        { status: 400 }
      );
    }

    const townId = id as TownId;
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d")
      .trim()
      .toLowerCase() as Granularity;
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");

    // DEBUG: Log de parámetros recibidos
    console.log("🔍 DEBUG pueblos/details endpoint:", {
      townId,
      url: req.url,
      granularity: g,
      start: startQ,
      end: endQ,
    });

    // Calcular rangos usando función específica por granularidad
    let ranges;
    let actualGranularity = g; // Granularidad efectiva que se usará

    if (startQ && endQ) {
      // Rango personalizado: determinar granularidad automáticamente
      const customRangeInfo = computeCustomRanges(startQ, endQ);
      actualGranularity = customRangeInfo.optimalGranularity;

      ranges = {
        current: { start: startQ, end: endQ },
        previous: { start: startQ, end: endQ }, // Para rangos personalizados, no hay previous
      };

      console.log("🔄 RANGO PERSONALIZADO detectado (pueblos):", {
        originalGranularity: g,
        optimalGranularity: actualGranularity,
        durationDays: customRangeInfo.durationDays,
        range: `${startQ} → ${endQ}`,
      });
    } else {
      // Usar función específica por granularidad
      const endDate =
        endQ ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // ayer por defecto
      ranges = computeRangesByGranularity(actualGranularity, endDate);
    }

    // DEBUG: Log de rangos calculados
    debugRanges(actualGranularity, ranges);
    console.log("📅 DEBUG rangos calculados (pueblos):", {
      originalGranularity: g,
      actualGranularity: actualGranularity,
      townId,
      current: ranges.current,
      previous: ranges.previous,
    });

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usar helper común para page_view requests
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: actualGranularity,
      metrics: [{ name: "eventCount" }],
    });

    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });
    const rows = resp.data.rows ?? [];

    // Procesar datos usando función genérica por granularidad
    const {
      currentSeries,
      previousSeries,
      totalCurrent,
      totalPrevious,
      xLabels,
      previousLabels,
    } = mapDataByGranularity(
      actualGranularity,
      rows as GA4Row[],
      matchTownIdFromPath,
      townId,
      ranges
    );

    // Formatear series con labels correctos
    const series = formatSeriesWithGranularity({
      currentSeries,
      previousSeries,
      totalCurrent,
      totalPrevious,
      xLabels,
      previousLabels,
    });

    // Definir ventana del donut - COMPORTAMIENTO ESPECIAL POR GRANULARIDAD
    let donutRanges;
    if (actualGranularity === "d") {
      // Para granularidad diaria: donut usa solo día actual vs día inmediatamente anterior
      const currentDay = ranges.current.end; // 2025-10-11
      const previousDay = new Date(currentDay);
      previousDay.setDate(previousDay.getDate() - 1);
      const prevDayISO = previousDay.toISOString().split("T")[0]; // 2025-10-10

      donutRanges = {
        current: { start: currentDay, end: currentDay },
        previous: { start: prevDayISO, end: prevDayISO },
      };
    } else if (actualGranularity === "w") {
      // Para granularidad semanal: donut usa sumatoria de toda la semana
      donutRanges = ranges; // Usar los mismos rangos que series (semana completa)
    } else {
      // Para otras granularidades (m, y): donut usa los mismos rangos que series
      donutRanges = ranges;
    }

    // Generar donut de categorías para este pueblo usando función utilitaria
    const donutData = buildCategoriesDonutForTown(
      rows as GA4Row[],
      matchTownIdFromPath,
      townId,
      matchCategoryIdFromPath,
      donutRanges.current.start,
      donutRanges.current.end,
      actualGranularity
    );

    // Calcular delta
    const deltaPct = computeDeltaPct(totalCurrent, totalPrevious);

    return NextResponse.json(
      {
        granularity: g, // Granularidad original solicitada
        actualGranularity: actualGranularity, // Granularidad efectiva usada
        range: ranges,
        property,
        id: townId,
        title: getTownLabel(townId),
        series,
        donutData,
        deltaPct,
        debug: {
          totalRows: rows.length,
          matchedRows: rows.filter((r) => {
            const url = String(r.dimensionValues?.[1]?.value ?? "");
            const path = safeUrlPathname(url);
            return matchTownIdFromPath(path) === townId;
          }).length,
          xLabelsCount: xLabels.length,
          currentTotal: totalCurrent,
          previousTotal: totalPrevious,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error en pueblos/details:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
