/**
 * Servicio para obtener totales + deltas de categorías del chatbot (Mindsaic v2)
 *
 * Reglas:
 * - patterns: ["*.{topic}"]
 * - Totales por categoría = suma de tags dentro del patrón
 * - Renderiza TODAS las categorías (0 si no hay datos)
 * - Delta null si prev <= 0
 * - TZ = UTC, end = rango actual
 */

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import {
  computeDeltaPercent,
  formatDateForMindsaic,
  resolvePreviousMap,
} from "./shared/helpers";
import {
  fetchMindsaicTagsData,
  type MindsaicPatternOutput,
} from "./shared/mindsaicV2Client";
import { buildCategoryPattern } from "./shared/v2Patterns";

/* ==================== Tipos ==================== */

export type CategoryTotalData = {
  id: CategoryId;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type CategoryTotalsResponse = {
  categories: CategoryTotalData[];
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
  /** Opcional: respuestas crudas del origen (solo para debug) */
  raw?: {
    response: Record<string, MindsaicPatternOutput>;
  };
};

export type FetchCategoryTotalsParams = {
  granularity?: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
};

/* ==================== Helpers ==================== */

function sumTagTotals(entry?: MindsaicPatternOutput): number {
  if (!entry?.tags) return 0;
  return entry.tags.reduce((sum, tag) => sum + (tag.total || 0), 0);
}

function sumSeriesMap(
  seriesMap: Record<string, Array<{ date: string; value: number }>> | undefined,
): number {
  if (!seriesMap) return 0;
  return Object.values(seriesMap)
    .flat()
    .reduce((sum, point) => sum + (point.value || 0), 0);
}

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene totales y deltas de todas las categorías del chatbot
 */
export async function fetchChatbotCategoryTotals(
  params: FetchCategoryTotalsParams = {},
): Promise<CategoryTotalsResponse> {
  const {
    granularity = "d",
    startDate = null,
    endDate = null,
    db = "huelva",
  } = params;

  const ranges = computeRangesForKPI(granularity, startDate, endDate);

  const patterns = CATEGORY_ID_ORDER.map(buildCategoryPattern).filter(
    (pattern): pattern is string => Boolean(pattern),
  );

  const response = await fetchMindsaicTagsData({
    patterns,
    startTime: formatDateForMindsaic(ranges.current.start),
    endTime: formatDateForMindsaic(ranges.current.end),
    id: db,
  });

  const categories: CategoryTotalData[] = CATEGORY_ID_ORDER.map(
    (categoryId) => {
      const pattern = buildCategoryPattern(categoryId);
      const entry = pattern ? response.output?.[pattern] : undefined;
      const prevMap = resolvePreviousMap(entry);
      const currentTotal =
        typeof entry?.totalCurrent === "number"
          ? entry.totalCurrent
          : sumTagTotals(entry);
      const prevTotal =
        typeof entry?.totalPrevious === "number"
          ? entry.totalPrevious
          : typeof entry?.totalPrev === "number"
            ? entry.totalPrev
            : sumSeriesMap(prevMap);
      const deltaAbs = currentTotal - prevTotal;
      const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

      return {
        id: categoryId,
        label: CATEGORY_META[categoryId].label,
        iconSrc: CATEGORY_META[categoryId].iconSrc,
        currentTotal,
        prevTotal,
        deltaAbs,
        deltaPercent,
      };
    },
  );

  return {
    categories,
    meta: {
      granularity,
      timezone: "UTC",
      range: {
        current: ranges.current,
        previous: ranges.previous,
      },
    },
    raw: {
      response: response.output || {},
    },
  };
}
