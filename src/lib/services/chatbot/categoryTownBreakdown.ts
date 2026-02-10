/**
 * Servicio para obtener breakdown de towns dentro de una categoría específica
 *
 * NIVEL 1: Categoría → Towns (category-first)
 *
 * Reglas:
 * - Pattern: "*.{categoria}" (solo esa categoría, usando segmento crudo)
 * - Filtro: profundidad === 3 (root.<categoria>.<pueblo>)
 * - POST dual: current + previous con granularity="d"
 * - Mapeo TOWN_SYNONYMS case-insensitive
 * - Renderizar TODOS los towns (TOWN_ID_ORDER) con 0 si no hay datos
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 */

import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";

import { computeDeltaPercent, formatDateForMindsaic } from "./shared/helpers";
import { fetchMindsaicTagsData } from "./shared/mindsaicV2Client";
import { buildSeriesForRange } from "./shared/seriesBuilder";
import type {
  CategoryTownBreakdownResponse,
  CategoryTownData,
  FetchCategoryTownBreakdownParams,
} from "./shared/types";
import {
  buildCategoryPattern,
  matchTownIdFromToken,
} from "./shared/v2Patterns";

// Type re-exports for consumers
export type {
  CategoryTownBreakdownResponse,
  CategoryTownData,
  FetchCategoryTownBreakdownParams,
  OthersBreakdownEntry,
} from "./shared/types";

/* ==================== Debug Flags ==================== */
const DEBUG_SERIES = false; // Cambiar a true para auditar series

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
  params: FetchCategoryTownBreakdownParams,
): Promise<CategoryTownBreakdownResponse> {
  const {
    categoryId,
    windowGranularity = "d",
    startISO = null,
    endISO = null,
    db = "huelva",
    representativeCategoryRaw = null,
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStartFormatted = formatDateForMindsaic(ranges.current.start);
  const currentEndFormatted = formatDateForMindsaic(ranges.current.end);
  const pattern = buildCategoryPattern(categoryId);
  if (!pattern) {
    return {
      categoryId,
      towns: [],
      series: { current: [], previous: [] },
      meta: {
        granularity: windowGranularity,
        timezone: "UTC",
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
      },
    };
  }

  const response = await fetchMindsaicTagsData({
    patterns: [pattern],
    startTime: currentStartFormatted,
    endTime: currentEndFormatted,
    id: db,
  });

  const output = response.output?.[pattern];
  const tags = output?.tags || [];
  const dataMap = output?.data || {};
  const prevMap = output?.previous || {};

  const totalsByTown = new Map<TownId | typeof OTHERS_ID, number>();
  const prevTotalsByTown = new Map<TownId | typeof OTHERS_ID, number>();

  for (const tag of tags) {
    const townId = matchTownIdFromToken(tag.id);
    const key = townId ?? (tag.id === OTHERS_ID ? OTHERS_ID : null);
    if (!key) continue;
    totalsByTown.set(key, (totalsByTown.get(key) || 0) + (tag.total || 0));

    const prevSeries = prevMap[tag.id] || [];
    const prevTotal = prevSeries.reduce((sum, p) => sum + (p.value || 0), 0);
    prevTotalsByTown.set(key, (prevTotalsByTown.get(key) || 0) + prevTotal);
  }

  const towns: CategoryTownData[] = TOWN_ID_ORDER.map((townId) => {
    const currentTotal = totalsByTown.get(townId) || 0;
    const prevTotal = prevTotalsByTown.get(townId) || 0;
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

  const otrosCurrentTotal = totalsByTown.get(OTHERS_ID) || 0;
  const otrosPrevTotal = prevTotalsByTown.get(OTHERS_ID) || 0;
  if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
    towns.push({
      townId: OTHERS_ID,
      label: "Otros",
      iconSrc: "/icons/otros.svg",
      currentTotal: otrosCurrentTotal,
      prevTotal: otrosPrevTotal,
      deltaAbs: otrosCurrentTotal - otrosPrevTotal,
      deltaPercent: computeDeltaPercent(otrosCurrentTotal, otrosPrevTotal),
    });
  }

  const currentTotalsByISO = new Map<string, number>();
  for (const series of Object.values(dataMap)) {
    for (const point of series) {
      const iso = `${point.date.slice(0, 4)}-${point.date.slice(4, 6)}-${point.date.slice(
        6,
        8,
      )}`;
      currentTotalsByISO.set(
        iso,
        (currentTotalsByISO.get(iso) || 0) + point.value,
      );
    }
  }
  const prevTotalsByISO = new Map<string, number>();
  for (const series of Object.values(prevMap)) {
    for (const point of series) {
      const iso = `${point.date.slice(0, 4)}-${point.date.slice(4, 6)}-${point.date.slice(
        6,
        8,
      )}`;
      prevTotalsByISO.set(iso, (prevTotalsByISO.get(iso) || 0) + point.value);
    }
  }

  const currentSeries: SeriesPoint[] = buildSeriesForRange(
    currentTotalsByISO,
    ranges.current.start,
    ranges.current.end,
    windowGranularity,
  );
  const previousSeries: SeriesPoint[] = buildSeriesForRange(
    prevTotalsByISO,
    ranges.previous.start,
    ranges.previous.end,
    windowGranularity,
  );

  if (DEBUG_SERIES) {
    console.log(
      `[fetchCategoryTownBreakdown] Series summary for categoryId="${categoryId}"`,
    );
    console.log(
      `  Current: ${currentSeries.length} buckets, sum=${currentSeries.reduce(
        (s, p) => s + p.value,
        0,
      )}`,
    );
    console.log(
      `  Previous: ${previousSeries.length} buckets, sum=${previousSeries.reduce(
        (s, p) => s + p.value,
        0,
      )}`,
    );
  }

  return {
    categoryId,
    towns,
    series: {
      current: currentSeries,
      previous: previousSeries,
    },
    meta: {
      granularity: windowGranularity,
      timezone: "UTC",
      range: {
        current: ranges.current,
        previous: ranges.previous,
      },
    },
  };
}
