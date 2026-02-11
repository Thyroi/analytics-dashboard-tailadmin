/**
 * Servicio para obtener breakdown de subcategorías dentro de un town+categoría
 *
 * NIVEL 2: Town+Categoría → Subcategorías
 *
 * Reglas (Mindsaic v2):
 * - Pattern: "<town>.<category>"
 * - POST /tags/data con id y patterns[]
 * - `tags` contiene totales por subcategoría
 * - `data` y `previous` contienen series por subcategoría
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import {
  computeDeltaPercent,
  groupSeriesByMonth,
  resolvePreviousMap,
  resolvePrevTotalFromTag,
} from "./shared/helpers";
import { fetchMindsaicTagsData } from "./shared/mindsaicV2Client";
import { buildCategoryTownPattern } from "./shared/v2Patterns";

/* ==================== Tipos ==================== */

export type TownCategorySubcatData = {
  subcategoryName: string; // Texto crudo normalizado
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
  series?: Array<{ time: string; value: number }>; // Series para comparativa
};

export type TownCategorySubcatBreakdownResponse = {
  townId: TownId;
  categoryId: CategoryId;
  subcategories: TownCategorySubcatData[];
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
    /** Indica si es una vista de "Otros" (claves no mapeadas del nivel 1) */
    source: {
      othersOnly: boolean;
    };
  };
  /** Opcional: respuestas crudas y request para depuración */
  raw?: {
    current: Record<string, Array<{ time: string; value: number }>>;
    previous: Record<string, Array<{ time: string; value: number }>>;
    request: {
      pattern: string;
      granularity: string;
      startTimeCurrent: string;
      endTimeCurrent: string;
      startTimePrevious: string;
      endTimePrevious: string;
      db: string;
    };
  };
};

export type FetchTownCategorySubcatBreakdownParams = {
  townId: TownId;
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
};

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de subcategorías para un town+categoría específico
 * REFACTORIZADO: Usa collectUniverseForView para universo unificado entre donut y series
 */
export async function fetchTownCategorySubcatBreakdown({
  townId,
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "huelva",
}: FetchTownCategorySubcatBreakdownParams): Promise<TownCategorySubcatBreakdownResponse> {
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);
  const pattern = buildCategoryTownPattern(categoryId, townId);

  const response = await fetchMindsaicTagsData({
    patterns: [pattern],
    startTime: ranges.current.start.replace(/-/g, ""),
    endTime: ranges.current.end.replace(/-/g, ""),
    id: db,
  });

  const output = response.output?.[pattern];
  const tags = output?.tags || [];
  const dataMap = output?.data || {};
  const prevMap = resolvePreviousMap(output);

  const toISO = (ymd: string) =>
    `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;

  const subcategories: TownCategorySubcatData[] = tags.map((tag) => {
    const prevTotal = resolvePrevTotalFromTag(tag, prevMap);
    const deltaAbs = (tag.total || 0) - prevTotal;
    const deltaPercent = computeDeltaPercent(tag.total || 0, prevTotal);
    const rawSeries = (dataMap[tag.id] || []).map((point) => ({
      time: toISO(point.date),
      value: point.value,
    }));
    const series =
      windowGranularity === "y" ? groupSeriesByMonth(rawSeries) : rawSeries;

    return {
      subcategoryName: tag.label || tag.id,
      currentTotal: tag.total || 0,
      prevTotal,
      deltaAbs,
      deltaPercent,
      series,
    };
  });

  const rawCurrent = Object.fromEntries(
    Object.entries(dataMap).map(([key, series]) => [
      key,
      series.map((point) => ({ time: point.date, value: point.value })),
    ]),
  );
  const rawPrevious = Object.fromEntries(
    Object.entries(prevMap).map(([key, series]) => [
      key,
      series.map((point) => ({ time: point.date, value: point.value })),
    ]),
  );

  return {
    townId,
    categoryId,
    subcategories,
    meta: {
      granularity: windowGranularity,
      timezone: "UTC",
      range: {
        current: ranges.current,
        previous: ranges.previous,
      },
      source: {
        othersOnly: false,
      },
    },
    raw: {
      current: rawCurrent,
      previous: rawPrevious,
      request: {
        pattern,
        granularity: "d",
        startTimeCurrent: ranges.current.start.replace(/-/g, ""),
        endTimeCurrent: ranges.current.end.replace(/-/g, ""),
        startTimePrevious: ranges.previous.start.replace(/-/g, ""),
        endTimePrevious: ranges.previous.end.replace(/-/g, ""),
        db,
      },
    },
  };
}
