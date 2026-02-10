/**
 * /api/analytics/v1/dimensions/categorias/[id]/details/route.ts
 * Mismo comportamiento del endpoint "details" original (series + donut + filtro town),
 * pero usando:
 *  - Parámetros de consulta: startDate, endDate, granularity
 *  - Cálculo de rangos y estructura de respuesta idénticos al endpoint "totales"
 */

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
import { runReportLimited } from "@/lib/utils/analytics/ga4RateLimit";
import { buildPageViewUnionRequest } from "@/lib/utils/analytics/ga4Requests";

import {
  formatSeriesWithGranularity,
  mapDataByGranularity,
  type GA4Row,
} from "@/lib/utils/core/granularityMapping";

import {
  buildTownsDonutForCategory,
  buildUrlsDonutForCategoryTown,
} from "@/lib/utils/data";
import { parseGA4Date } from "@/lib/utils/data/parsers";

import {
  matchCategoryIdFromPath,
  matchTownIdFromPath,
  safeUrlPathname,
} from "@/lib/utils/routing/pathMatching";

import {
  calculatePreviousPeriodOnly,
  determineGA4Granularity,
} from "@/lib/utils/time/rangeCalculations";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";

import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

type Ranges = {
  current: { start: string; end: string };
  previous: { start: string; end: string };
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    // Validar categoría
    if (!CATEGORY_ID_ORDER.includes(id as CategoryId)) {
      return NextResponse.json(
        { error: `Invalid categoryId '${id}'` },
        { status: 400 },
      );
    }

    const categoryId = id as CategoryId;

    // === Query params - SOPORTE MÚLTIPLE para compatibilidad ===
    const { searchParams } = new URL(req.url);

    // Nuevo formato (aligned con totales)
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const granularityOverride = searchParams.get(
      "granularity",
    ) as Granularity | null;

    // Formato legacy del servicio (compatibilidad)
    const currentStart = searchParams.get("currentStart");
    const currentEnd = searchParams.get("currentEnd");
    const legacyGranularity = searchParams.get("g") as Granularity | null;

    const townFilter = searchParams.get("townId"); // mantenemos compatibilidad para drilldown

    let startQ: string;
    let endQ: string;
    let finalGranularityParam: Granularity | null;

    // Determinar qué formato se está usando
    if (startDate && endDate) {
      // Formato nuevo
      startQ = startDate;
      endQ = endDate;
      finalGranularityParam = granularityOverride;
    } else if (currentStart && currentEnd) {
      // Formato legacy - usar solo el período actual
      startQ = currentStart;
      endQ = currentEnd;
      finalGranularityParam = legacyGranularity;
    } else {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: (startDate,endDate) or (currentStart,currentEnd)",
        },
        { status: 400 },
      );
    }

    // Calcular solo rangos (sin granularidad automática)
    const calculation = calculatePreviousPeriodOnly(startQ, endQ);

    // Granularidad final: usar override o default 'd'
    const finalGranularity: Granularity = finalGranularityParam || "d";

    // Para GA4: Usar función centralizada para determinar granularidad de GA4
    const ga4Granularity: Granularity =
      determineGA4Granularity(finalGranularity);

    // Ranges en el mismo formato que "totales"
    const ranges: Ranges = {
      current: calculation.currentRange,
      previous: calculation.prevRange,
    };

    // Rangos para donut (para granularidad diaria, solo el último día)
    const donutRanges =
      finalGranularity === "d"
        ? {
            current: { start: endQ, end: endQ },
            previous: { start: endQ, end: endQ },
          }
        : ranges;

    // === GA ===
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Usar el helper común para page_view requests (pasar granularidad UI para dimensiones)
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: ga4Granularity, // ✅ CORRECTO: Solo "y" usa yearMonth, resto usa date
      metrics: [{ name: "eventCount" }],
    });

    const resp = await runReportLimited(analytics, {
      property,
      requestBody,
    });

    const rows: GA4Row[] = (resp.data.rows ?? []) as GA4Row[];

    // Filtro opcional por town para escenarios de drilldown (misma lógica que el details original)
    const filteredRows: GA4Row[] = townFilter
      ? rows.filter((r) => {
          const url = String(r.dimensionValues?.[1]?.value ?? "");
          const path = safeUrlPathname(url);
          return matchTownIdFromPath(path) === townFilter;
        })
      : rows;

    // Mapear datos por granularidad (misma función del details original)
    const {
      currentSeries,
      previousSeries,
      totalCurrent,
      totalPrevious,
      xLabels,
      previousLabels,
    } = mapDataByGranularity(
      finalGranularity,
      filteredRows,
      matchCategoryIdFromPath,
      categoryId,
      ranges,
    );

    // Series formateadas (incluye totales y labels)
    const series = formatSeriesWithGranularity({
      currentSeries,
      previousSeries,
      totalCurrent,
      totalPrevious,
      xLabels,
      previousLabels,
    });

    // Donut: si hay townFilter => URLs; si no => pueblos
    const donutData = townFilter
      ? buildUrlsDonutForCategoryTown(
          filteredRows,
          matchCategoryIdFromPath,
          categoryId,
          matchTownIdFromPath,
          townFilter,
          donutRanges.current.start,
          donutRanges.current.end,
          finalGranularity,
        )
      : buildTownsDonutForCategory(
          rows,
          matchCategoryIdFromPath,
          categoryId,
          matchTownIdFromPath,
          donutRanges.current.start,
          donutRanges.current.end,
          finalGranularity,
        );

    const drilldownRows = townFilter
      ? filteredRows.filter((r) => {
          const url = String(r.dimensionValues?.[1]?.value ?? "");
          const path = safeUrlPathname(url);
          return (
            matchTownIdFromPath(path) === townFilter &&
            matchCategoryIdFromPath(path) === categoryId
          );
        })
      : [];

    const topCurrentUrls =
      townFilter && finalGranularity === "d"
        ? donutData.slice(0, 5).map((item) => item.label)
        : [];

    const topPreviousUrls =
      townFilter && finalGranularity === "d"
        ? (() => {
            const totals = new Map<string, number>();

            for (const r of drilldownRows) {
              const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
              if (!dateRaw) continue;

              const iso = parseGA4Date(dateRaw, finalGranularity);
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
      townFilter && finalGranularity === "d" && unionUrls.length > 0
        ? (() => {
            const countsCurrent = new Map<string, number>();
            const countsPrevious = new Map<string, number>();

            for (const r of drilldownRows) {
              const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
              if (!dateRaw) continue;

              const iso = parseGA4Date(dateRaw, finalGranularity);
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

    // Delta (misma semántica null-safe del util)
    const deltaPct = computeDeltaPct(totalCurrent, totalPrevious);

    // === RESPUESTA alineada al estilo de "totales" ===
    // - bloque calculation con requested/finalGranularity, reason y periodos
    // - bloque data con property e info propia del details
    return NextResponse.json(
      {
        success: true,
        calculation: {
          requestedGranularity: finalGranularity,
          finalGranularity,
          granularityReason: finalGranularityParam
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
          id: categoryId,
          title: getCategoryLabel(categoryId),
          // Igual que en details original, exponemos series y donut
          series,
          donutData,
          deltaPct,
          seriesByUrl,
          // Totales explícitos del periodo actual/anterior (útiles para tarjetas o depuración)
          totals: {
            current: totalCurrent,
            previous: totalPrevious,
          },
          // Mantengo un bloque debug (opcional)
          debug: {
            totalRows: rows.length,
            filteredRows: filteredRows.length,
            townFilter: townFilter ?? null,
            matchedRows: filteredRows.filter((r) => {
              const url = String(r.dimensionValues?.[1]?.value ?? "");
              const path = safeUrlPathname(url);
              return matchCategoryIdFromPath(path) === categoryId;
            }).length,
            xLabelsCount: xLabels.length,
          },
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error en details reconstruido:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
