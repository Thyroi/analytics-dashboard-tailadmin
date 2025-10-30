/**
 * Servicio para obtener breakdown de towns dentro de una categoría específica
 *
 * NIVEL 1: Categoría → Towns (category-first)
 *
 * Reglas:
 * - Pattern: "root.<categoriaRaw>.*" (solo esa categoría, usando segmento crudo)
 * - Filtro: profundidad === 3 (root.<categoria>.<pueblo>)
 * - POST dual: current + previous con granularity="d"
 * - Mapeo TOWN_SYNONYMS case-insensitive
 * - Renderizar TODOS los towns (TOWN_ID_ORDER) con 0 si no hay datos
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 */

import { type CategoryId } from "@/lib/taxonomy/categories";
import { matchTownId } from "@/lib/taxonomy/normalize";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";

// Shared module imports
import {
  formatDateForMindsaic,
  computeDeltaPercent,
} from "./shared/helpers";
import { fetchMindsaicDataForCategory } from "./shared/mindsaicClient";
import { buildSeriesForRange } from "./shared/seriesBuilder";
import {
  parseCategoryTowns,
  aggregateDailyTotals,
} from "./shared/categoryParsers";
import type {
  CategoryTownData,
  CategoryTownBreakdownResponse,
  FetchCategoryTownBreakdownParams,
} from "./shared/types";

// Type re-exports for consumers
export type {
  OthersBreakdownEntry,
  CategoryTownData,
  CategoryTownBreakdownResponse,
  FetchCategoryTownBreakdownParams,
} from "./shared/types";

/* ==================== Debug Flags ==================== */
const DEBUG_SERIES = false; // Cambiar a true para auditar el universo de claves y series

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de towns dentro de una categoría específica
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODOS los towns aunque no tengan datos (0 y null).
 * Usa segmento crudo representativo para la categoría.
 *
 * NIVEL 1: root.<categoria>.<town> (profundidad 3, category-first)
 */
export async function fetchCategoryTownBreakdown(
  params: FetchCategoryTownBreakdownParams
): Promise<CategoryTownBreakdownResponse> {
  const {
    categoryId,
    windowGranularity = "d",
    startISO = null,
    endISO = null,
    db = "project_huelva",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    representativeCategoryRaw = null,
  } = params;

  // 1. Determinar el segmento a usar (representativo manual o mapping por categoría)
  // Nota: representativeCategoryRaw ya no se usa para el patrón; mantenemos compat por si lo reintroducimos en Nivel 2

  // 2. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 3. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStartFormatted = formatDateForMindsaic(ranges.current.start);
  const currentEndFormatted = formatDateForMindsaic(ranges.current.end);
  const prevStartFormatted = formatDateForMindsaic(ranges.previous.start);
  const prevEndFormatted = formatDateForMindsaic(ranges.previous.end);

  // 4. Hacer dos POST paralelos con timeout 15s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const [currentResponse, prevResponse] = await Promise.all([
      fetchMindsaicDataForCategory(
        categoryId,
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicDataForCategory(
        categoryId,
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por town (depth=3) usando helpers compartidos
    const currentResult = parseCategoryTowns(currentResponse.output || {}, categoryId);
    const prevResult = parseCategoryTowns(prevResponse.output || {}, categoryId);

    const currentTotals = currentResult.totals;
    const prevTotals = prevResult.totals;

    // 5b. Construir mapa de raw segments por TownId para Nivel 2
    const townRawSegmentsById: Record<
      TownId,
      Record<string, number>
    > = {} as Record<TownId, Record<string, number>>;

    // Recorrer todas las claves de output y agrupar por townId
    const addRawToTown = (key: string, total: number) => {
      const parts = key.split(".");
      if (parts.length !== 3) return; // only depth 3
      const rawSegment = parts[2];
      const townId = matchTownId(rawSegment);
      if (!townId) return; // No mapear si no se puede normalizar
      townRawSegmentsById[townId] = townRawSegmentsById[townId] || {};
      const prev = townRawSegmentsById[townId][rawSegment] || 0;
      townRawSegmentsById[townId][rawSegment] = prev + total;
    };

    for (const [k, series] of Object.entries(currentResponse.output || {})) {
      // only depth 3
      const parts = k.split(".");
      if (parts.length !== 3) continue;
      const total = series.reduce((s, p) => s + (p.value || 0), 0);
      addRawToTown(k, total);
    }

    // 6. Construir resultado final con TODOS los towns (sin "otros" si está en 0)
    const towns: CategoryTownData[] = TOWN_ID_ORDER.map((townId) => {
      const currentTotal = currentTotals.get(townId) || 0;
      const prevTotal = prevTotals.get(townId) || 0;
      const deltaAbs = currentTotal - prevTotal;
      const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

      return {
        townId,
        label: TOWN_META[townId].label,
        iconSrc: TOWN_META[townId].iconSrc,
        currentTotal,
        prevTotal,
        deltaAbs,
        deltaPercent,
      };
    });

    // Agregar "otros" si tiene datos
    const otrosCurrentTotal = currentTotals.get(OTHERS_ID) || 0;
    const otrosPrevTotal = prevTotals.get(OTHERS_ID) || 0;
    if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
      towns.push({
        townId: OTHERS_ID,
        label: "Otros",
        iconSrc: "/icons/otros.svg", // Placeholder
        currentTotal: otrosCurrentTotal,
        prevTotal: otrosPrevTotal,
        deltaAbs: otrosCurrentTotal - otrosPrevTotal,
        deltaPercent: computeDeltaPercent(otrosCurrentTotal, otrosPrevTotal),
      });
    }

    // 7. Series agregadas por día para la categoría usando helpers compartidos
    const currentTotalsByISO = aggregateDailyTotals(
      currentResponse.output || {},
      categoryId
    );
    const prevTotalsByISO = aggregateDailyTotals(
      prevResponse.output || {},
      categoryId
    );
    const currentSeries: SeriesPoint[] = buildSeriesForRange(
      currentTotalsByISO,
      ranges.current.start,
      ranges.current.end,
      windowGranularity // Pasar granularidad para bucketing correcto
    );
    const previousSeries: SeriesPoint[] = buildSeriesForRange(
      prevTotalsByISO,
      ranges.previous.start,
      ranges.previous.end,
      windowGranularity // Pasar granularidad para bucketing correcto
    );

    if (DEBUG_SERIES) {
      console.log(
        `[fetchCategoryTownBreakdown] Series summary for categoryId="${categoryId}"`
      );
      console.log(
        `  Current: ${currentSeries.length} buckets, sum=${currentSeries.reduce(
          (s, p) => s + p.value,
          0
        )}`
      );
      console.log(
        `  Previous: ${
          previousSeries.length
        } buckets, sum=${previousSeries.reduce((s, p) => s + p.value, 0)}`
      );
    }

    return {
      categoryId,
      towns,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
      townRawSegmentsById,
      othersBreakdown: {
        current: currentResult.othersBreakdown,
        previous: prevResult.othersBreakdown,
      },
      meta: {
        granularity: windowGranularity,
        timezone: "UTC",
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
      },
      raw: {
        current: currentResponse,
        previous: prevResponse,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Timeout al consultar towns de la categoría ${categoryId} (15s)`
      );
    }

    throw error;
  }
}
