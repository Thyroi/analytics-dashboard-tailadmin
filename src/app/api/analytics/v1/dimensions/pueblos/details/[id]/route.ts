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
} from "@/lib/utils/analytics/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/analytics/ga4Requests";
import {
  formatSeriesWithGranularity,
  mapDataByGranularity,
  type GA4Row,
} from "@/lib/utils/core/granularityMapping";
import {
  buildCategoriesDonutForTown,
  buildUrlsDonutForTownCategory,
} from "@/lib/utils/data/seriesAndDonuts";
import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import {
  computeCustomRanges,
  computeRangesByGranularity,
  debugRanges,
} from "@/lib/utils/time/granularityRanges";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
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
    const categoryFilter = searchParams.get("categoryId"); // Filter by specific category for drilldown

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
    } else {
      // Usar función específica por granularidad
      const endDate =
        endQ ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // ayer por defecto
      ranges = computeRangesByGranularity(actualGranularity, endDate);
    }

    // DEBUG: Log de rangos calculados
    debugRanges(actualGranularity, ranges);

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

    // Si hay filtro de categoría, pre-filtrar las filas para drilldown
    const filteredRows = categoryFilter
      ? rows.filter((r) => {
          const url = String(r.dimensionValues?.[1]?.value ?? "");
          const path = safeUrlPathname(url);
          const categoryId = matchCategoryIdFromPath(path);
          return categoryId === categoryFilter;
        })
      : rows;

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
      filteredRows as GA4Row[],
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

    // Definir ventana del donut - DEBE SER CONSISTENTE CON LAS SERIES
    let donutRanges;
    if (actualGranularity === "d") {
      // Para granularidad diaria: donut usa LOS MISMOS rangos que las series
      // Si las series usan 1 día, el donut también debe usar 1 día
      // Si las series usan 7 días, el donut también debe usar 7 días
      donutRanges = ranges; // Usar los mismos rangos que series para consistencia
    } else if (actualGranularity === "w") {
      // Para granularidad semanal: donut usa sumatoria de toda la semana
      donutRanges = ranges; // Usar los mismos rangos que series (semana completa)
    } else {
      // Para otras granularidades (m, y): donut usa los mismos rangos que series
      donutRanges = ranges;
    }

    // Generar donut de categorías para este pueblo usando función utilitaria
    // Si hay filtro de categoría, el donut mostrará URLs; sino, mostrará categorías
    const donutData = categoryFilter
      ? buildUrlsDonutForTownCategory(
          filteredRows as GA4Row[],
          matchTownIdFromPath,
          townId,
          matchCategoryIdFromPath,
          categoryFilter,
          donutRanges.current.start,
          donutRanges.current.end,
          actualGranularity
        )
      : buildCategoriesDonutForTown(
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
