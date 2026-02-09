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
} from "@/lib/utils/data";
import { parseGA4Date } from "@/lib/utils/data/parsers";
import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";
import { debugRanges } from "@/lib/utils/time/granularityRanges";
import {
  calculatePreviousPeriodOnly,
  determineGA4Granularity,
} from "@/lib/utils/time/rangeCalculations";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

/* -------- handler -------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    // Validar que sea un pueblo válido
    if (!TOWN_ID_ORDER.includes(id as TownId)) {
      return NextResponse.json(
        { error: `Invalid townId '${id}'` },
        { status: 400 },
      );
    }

    const townId = id as TownId;
    const { searchParams } = new URL(req.url);

    // ✅ NUEVO: Recibir startDate y endDate (como totales)
    const startQ = searchParams.get("startDate");
    const endQ = searchParams.get("endDate");
    const granularityParam = searchParams.get(
      "granularity",
    ) as Granularity | null;
    const categoryFilter = searchParams.get("categoryId"); // Filter by specific category for drilldown

    // Validar que tenemos fechas requeridas
    if (!startQ || !endQ) {
      return NextResponse.json(
        {
          error: "Missing required parameters: startDate and endDate",
        },
        { status: 400 },
      );
    }

    // ✅ CORRECCIÓN: NO recalcular rangos, usar las fechas tal como vienen
    // El frontend ya calculó los rangos correctos con computeRangesForSeries
    const calculation = calculatePreviousPeriodOnly(startQ, endQ);

    // ✅ NUEVO: Granularidad viene del parámetro (el frontend ya la calculó)
    const actualGranularity = granularityParam || "d";

    const ranges = {
      current: { start: startQ, end: endQ }, // Usar fechas directamente
      previous: calculation.prevRange, // Solo calcular previous
    };

    // Para series y donuts usar los mismos rangos (sin lógica especial para 'd')
    const donutRanges = ranges;

    // DEBUG: Log de rangos calculados
    debugRanges(actualGranularity, ranges);

    // GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usar helper común para page_view requests con granularidad para GA4
    const ga4Granularity = determineGA4Granularity(actualGranularity);
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: ga4Granularity, // ✅ Usar granularidad correcta para GA4
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
      ranges,
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
          actualGranularity,
        )
      : buildCategoriesDonutForTown(
          rows as GA4Row[],
          matchTownIdFromPath,
          townId,
          matchCategoryIdFromPath,
          donutRanges.current.start,
          donutRanges.current.end,
          actualGranularity,
        );

    const drilldownRows = categoryFilter
      ? (filteredRows as GA4Row[]).filter((r) => {
          const url = String(r.dimensionValues?.[1]?.value ?? "");
          const path = safeUrlPathname(url);
          return (
            matchTownIdFromPath(path) === townId &&
            matchCategoryIdFromPath(path) === categoryFilter
          );
        })
      : [];

    const topCurrentUrls =
      categoryFilter && actualGranularity === "d"
        ? donutData.slice(0, 5).map((item) => item.label)
        : [];

    const topPreviousUrls =
      categoryFilter && actualGranularity === "d"
        ? (() => {
            const totals = new Map<string, number>();

            for (const r of drilldownRows) {
              const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
              if (!dateRaw) continue;

              const iso = parseGA4Date(dateRaw, actualGranularity);
              if (iso < ranges.previous.start || iso > ranges.previous.end) {
                continue;
              }

              const url = String(r.dimensionValues?.[1]?.value ?? "");
              const value = Number(r.metricValues?.[0]?.value ?? 0);
              totals.set(url, (totals.get(url) || 0) + value);
            }

            return Array.from(totals.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([url]) => url);
          })()
        : [];

    const unionUrls = [
      ...topCurrentUrls,
      ...topPreviousUrls.filter((url) => !topCurrentUrls.includes(url)),
    ];
    const unionSet = new Set(unionUrls);

    const seriesByUrl =
      categoryFilter && actualGranularity === "d" && unionUrls.length > 0
        ? (() => {
            const countsCurrent = new Map<string, number>();
            const countsPrevious = new Map<string, number>();

            for (const r of drilldownRows) {
              const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
              if (!dateRaw) continue;

              const iso = parseGA4Date(dateRaw, actualGranularity);
              const url = String(r.dimensionValues?.[1]?.value ?? "");
              if (!unionSet.has(url)) continue;

              const value = Number(r.metricValues?.[0]?.value ?? 0);

              if (iso >= ranges.current.start && iso <= ranges.current.end) {
                countsCurrent.set(url, (countsCurrent.get(url) || 0) + value);
              }

              if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
                countsPrevious.set(url, (countsPrevious.get(url) || 0) + value);
              }
            }

            return unionUrls.map((url) => ({
              path: url,
              name: url.split("/").filter(Boolean).pop() || url,
              current: countsCurrent.get(url) ?? null,
              previous: countsPrevious.get(url) ?? null,
            }));
          })()
        : undefined;

    // Calcular delta
    const deltaPct = computeDeltaPct(totalCurrent, totalPrevious);

    return NextResponse.json(
      {
        granularity: granularityParam, // Granularidad original solicitada
        actualGranularity: actualGranularity, // Granularidad efectiva usada
        range: ranges,
        property,
        id: townId,
        title: getTownLabel(townId),
        series,
        donutData,
        deltaPct,
        seriesByUrl,
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
      { status: 200 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error en pueblos/details:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
