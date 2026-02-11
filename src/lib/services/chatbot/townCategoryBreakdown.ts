/**
 * Servicio para obtener breakdown de categorías dentro de un town específico
 *
 * NIVEL 1: Town → Categorías
 *
 * Reglas (Mindsaic v2):
 * - Pattern: "<town>.*"
 * - `tags` contiene totales por categoría
 * - `data` y `previous` contienen series por categoría
 */

import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import type { SeriesPoint } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";
import {
  computeDeltaPercent,
  formatDateForMindsaic,
  resolvePreviousMap,
  resolvePrevTotalFromTag,
} from "./shared/helpers";
import { fetchMindsaicTagsData } from "./shared/mindsaicV2Client";
import { buildSeriesForRange } from "./shared/seriesBuilder";
import type {
  FetchTownCategoryBreakdownParams,
  TownCategoryBreakdownResponse,
  TownCategoryData,
} from "./shared/types";
import {
  buildTownPattern,
  matchCategoryIdFromToken,
} from "./shared/v2Patterns";

export type {
  FetchTownCategoryBreakdownParams,
  OthersBreakdownEntry,
  TownCategoryBreakdownResponse,
  TownCategoryData,
} from "./shared/types";

export async function fetchTownCategoryBreakdown({
  townId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "huelva",
}: FetchTownCategoryBreakdownParams): Promise<TownCategoryBreakdownResponse> {
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);
  const pattern = buildTownPattern(townId);

  const response = await fetchMindsaicTagsData({
    patterns: [pattern],
    startTime: formatDateForMindsaic(ranges.current.start),
    endTime: formatDateForMindsaic(ranges.current.end),
    id: db,
  });

  const output = response.output?.[pattern];
  const tags = output?.tags || [];
  const dataMap = output?.data || {};
  const prevMap = resolvePreviousMap(output);

  const totalsByCategory = new Map<string, number>();
  const prevTotalsByCategory = new Map<string, number>();

  for (const tag of tags) {
    const categoryId = matchCategoryIdFromToken(tag.id);
    const key = categoryId ?? (tag.id === OTHERS_ID ? OTHERS_ID : null);
    if (!key) continue;

    totalsByCategory.set(
      key,
      (totalsByCategory.get(key) || 0) + (tag.total || 0),
    );

    const prevTotal = resolvePrevTotalFromTag(tag, prevMap);
    prevTotalsByCategory.set(
      key,
      (prevTotalsByCategory.get(key) || 0) + prevTotal,
    );
  }

  const categories: TownCategoryData[] = CATEGORY_ID_ORDER.map((categoryId) => {
    const currentTotal = totalsByCategory.get(categoryId) || 0;
    const prevTotal = prevTotalsByCategory.get(categoryId) || 0;
    const deltaAbs = currentTotal - prevTotal;
    const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

    return {
      categoryId,
      label: CATEGORY_META[categoryId].label,
      iconSrc: CATEGORY_META[categoryId].iconSrc,
      currentTotal,
      prevTotal,
      deltaAbs,
      deltaPercent,
    };
  });

  const otrosCurrentTotal = totalsByCategory.get(OTHERS_ID) || 0;
  const otrosPrevTotal = prevTotalsByCategory.get(OTHERS_ID) || 0;
  if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
    categories.push({
      categoryId: OTHERS_ID,
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

  return {
    townId,
    categories,
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
