/**
 * Debug endpoint para investigar discrepancias entre donut y series
 */

import { getCategoryLabel, type CategoryId } from "@/lib/taxonomy/categories";
import { getTownLabel, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "2025-10-22";
    const endDate = searchParams.get("endDate") || "2025-10-22";
    const categoryId =
      (searchParams.get("categoryId") as CategoryId) || "naturaleza";
    const townId = (searchParams.get("townId") as TownId) || "almonte";
    const granularity = (searchParams.get("granularity") || "d") as Granularity;

    // Calcular rangos usando nueva función
    const calculation = calculatePreviousPeriodAndGranularity(
      startDate,
      endDate
    );

    // URLs para las APIs de details
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:3000`;

    const categoryDetailsUrl = `${baseUrl}/api/analytics/v1/dimensions/categorias/details/${categoryId}?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`;
    const townDetailsUrl = `${baseUrl}/api/analytics/v1/dimensions/pueblos/details/${townId}?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`;

    // Intentar hacer llamadas reales a las APIs
    let categoryDetailsData = null;
    let townDetailsData = null;
    const apiErrors: string[] = [];

    try {
      const categoryResponse = await fetch(categoryDetailsUrl);
      if (categoryResponse.ok) {
        categoryDetailsData = await categoryResponse.json();
      } else {
        apiErrors.push(
          `Category API: ${categoryResponse.status} ${categoryResponse.statusText}`
        );
      }
    } catch (error) {
      apiErrors.push(
        `Category API error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    try {
      const townResponse = await fetch(townDetailsUrl);
      if (townResponse.ok) {
        townDetailsData = await townResponse.json();
      } else {
        apiErrors.push(
          `Town API: ${townResponse.status} ${townResponse.statusText}`
        );
      }
    } catch (error) {
      apiErrors.push(
        `Town API error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const debugInfo = {
      input: {
        startDate,
        endDate,
        categoryId: categoryId,
        categoryLabel: getCategoryLabel(categoryId),
        townId: townId,
        townLabel: getTownLabel(townId),
        requestedGranularity: granularity,
      },
      calculation: {
        finalGranularity: calculation.granularity,
        granularityReason: `Auto-selected based on ${calculation.durationDays} days duration`,
        durationDays: calculation.durationDays,
        currentRange: calculation.currentRange,
        previousRange: calculation.prevRange,
      },
      apis: {
        categoryDetails: {
          url: categoryDetailsUrl,
          note: "Para obtener series y donut de categoría",
          data: categoryDetailsData,
          hasData: !!categoryDetailsData,
        },
        townDetails: {
          url: townDetailsUrl,
          note: "Para obtener series y donut de pueblo",
          data: townDetailsData,
          hasData: !!townDetailsData,
        },
      },
      apiErrors,
      analysis: categoryDetailsData
        ? {
            seriesTotal:
              categoryDetailsData.series?.current?.reduce(
                (sum: number, point: { value?: number }) =>
                  sum + (point.value || 0),
                0
              ) || 0,
            donutTotal:
              categoryDetailsData.donutData?.reduce(
                (sum: number, item: { value?: number }) =>
                  sum + (item.value || 0),
                0
              ) || 0,
            seriesPoints: categoryDetailsData.series?.current?.length || 0,
            donutItems: categoryDetailsData.donutData?.length || 0,
            lastSeriesPoint:
              categoryDetailsData.series?.current?.[
                categoryDetailsData.series.current.length - 1
              ]?.value || 0,
            deltaPct: categoryDetailsData.deltaPct,
          }
        : null,
      potentialIssues: [
        {
          issue: "Donut vs Series diferentes rangos",
          description:
            "El donut podría usar un rango de 1 día mientras las series usan 7 días",
          investigation:
            "Verificar que ambos usen los mismos rangos calculados",
        },
        {
          issue: "Filtros diferentes",
          description:
            "El donut podría tener filtros adicionales (por pueblo/categoría)",
          investigation:
            "Verificar si hay parámetros townId o categoryId en las queries",
        },
        {
          issue: "Agregación temporal",
          description:
            "Las series podrían sumar varios días mientras el donut solo usa el último",
          investigation:
            "Verificar si el punto actual es suma de período o valor específico",
        },
      ],
      nextSteps: [
        "1. Hacer llamada real a categoryDetails y verificar totales",
        "2. Comparar rangos usados para donut vs series",
        "3. Verificar si hay filtros adicionales aplicados",
        "4. Comprobar lógica de agregación temporal",
      ],
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Error in debug details:", error);
    return NextResponse.json(
      {
        error: "Debug details failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
