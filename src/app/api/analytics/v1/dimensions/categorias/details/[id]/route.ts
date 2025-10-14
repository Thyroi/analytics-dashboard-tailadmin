import {
  CATEGORY_ID_ORDER,
  getCategoryLabel,
  type CategoryId,
} from "@/lib/taxonomy/categories";
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
  buildTownsDonutForCategory,
  buildUrlsDonutForCategoryTown,
} from "@/lib/utils/data/seriesAndDonuts";
import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import {
  computeCustomRanges,
  computeRangesByGranularity,
  computeRangesByGranularityForSeries,
  debugRanges,
} from "@/lib/utils/time/granularityRanges";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

/* -------- handler (simplificado usando funciones utilitarias) -------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validar que sea una categoría válida
    if (!CATEGORY_ID_ORDER.includes(id as CategoryId)) {
      return NextResponse.json(
        { error: `Invalid categoryId '${id}'` },
        { status: 400 }
      );
    }

    const categoryId = id as CategoryId;
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d")
      .trim()
      .toLowerCase() as Granularity;
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");
    const townFilter = searchParams.get("townId"); // Filter by specific town for drilldown

    // Calcular rangos usando función específica por granularidad
    let ranges; // Rangos para SERIES (7 días en g='d')
    let donutRanges; // Rangos para DONUTS (1 día en g='d')
    let actualGranularity = g; // Granularidad efectiva que se usará

    if (startQ && endQ) {
      // Rango personalizado: determinar granularidad automáticamente
      const customRangeInfo = computeCustomRanges(startQ, endQ);
      actualGranularity = customRangeInfo.optimalGranularity;

      ranges = {
        current: { start: startQ, end: endQ },
        previous: { start: startQ, end: endQ }, // Para rangos personalizados, no hay previous
      };
      donutRanges = ranges; // En rangos custom, donut usa lo mismo
    } else {
      // Usar función específica por granularidad
      const endDate =
        endQ ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // ayer por defecto

      // SERIES: usar 7 días para granularidad 'd'
      ranges = computeRangesByGranularityForSeries(actualGranularity, endDate);

      // DONUTS: usar 1 día para granularidad 'd'
      donutRanges = computeRangesByGranularity(actualGranularity, endDate);
    }

    // DEBUG: Log de rangos calculados
    debugRanges(actualGranularity, ranges);

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usar la nueva función helper para page_view requests con granularidad
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

    // Apply town filter if provided for drilldown scenarios
    const filteredRows = townFilter
      ? rows.filter((r) => {
          const url = String(r.dimensionValues?.[1]?.value ?? "");
          const path = safeUrlPathname(url);
          return matchTownIdFromPath(path) === townFilter;
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
      matchCategoryIdFromPath,
      categoryId,
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

    // IMPORTANTE: donutRanges ya está definido arriba con la lógica correcta:
    // - Para g='d': donut usa 1 día (ayer), series usa 7 días
    // - Para otras granularidades: donut y series usan lo mismo

    // Generar donut usando función utilitaria con rangos específicos
    // Si hay filtro de pueblo, el donut mostrará URLs; sino, mostrará pueblos
    const donutData = townFilter
      ? buildUrlsDonutForCategoryTown(
          filteredRows as GA4Row[],
          matchCategoryIdFromPath,
          categoryId,
          matchTownIdFromPath,
          townFilter,
          donutRanges.current.start,
          donutRanges.current.end,
          actualGranularity
        )
      : buildTownsDonutForCategory(
          rows as GA4Row[],
          matchCategoryIdFromPath,
          categoryId,
          matchTownIdFromPath,
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
        id: categoryId,
        title: getCategoryLabel(categoryId),
        series,
        donutData,
        deltaPct,
        debug: {
          totalRows: rows.length,
          filteredRows: filteredRows.length,
          townFilter,
          matchedRows: filteredRows.filter((r) => {
            const url = String(r.dimensionValues?.[1]?.value ?? "");
            const path = safeUrlPathname(url);
            return matchCategoryIdFromPath(path) === categoryId;
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
    console.error("❌ Error en nueva versión details:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
