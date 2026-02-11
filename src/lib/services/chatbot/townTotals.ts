/**
 * Servicio para obtener totales + deltas de pueblos del chatbot (Mindsaic v2)
 *
 * Reglas:
 * - patterns: ["{town}.*"]
 * - Totales por pueblo = suma de tags dentro del patrón
 * - Renderiza TODOS los pueblos (0 si no hay datos)
 * - Delta null si prev <= 0
 */

import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
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
import { buildTownPattern } from "./shared/v2Patterns";

/* ==================== Tipos ==================== */

export type TownTotalData = {
  id: TownId;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type TownTotalsResponse = {
  towns: TownTotalData[];
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

export type FetchTownTotalsParams = {
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
 * Obtiene totales y deltas de todos los pueblos del chatbot
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODOS los pueblos aunque no tengan datos (0 y null).
 */
export async function fetchChatbotTownTotals(
  params: FetchTownTotalsParams = {},
): Promise<TownTotalsResponse> {
  const {
    granularity = "d",
    startDate = null,
    endDate = null,
    db = "huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(granularity, startDate, endDate);

  const patterns = TOWN_ID_ORDER.map(buildTownPattern);

  const response = await fetchMindsaicTagsData({
    patterns,
    startTime: formatDateForMindsaic(ranges.current.start),
    endTime: formatDateForMindsaic(ranges.current.end),
    id: db,
  });

  const towns: TownTotalData[] = TOWN_ID_ORDER.map((townId) => {
    const pattern = buildTownPattern(townId);
    const entry = response.output?.[pattern];
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
      id: townId,
      label: TOWN_META[townId].label,
      iconSrc: TOWN_META[townId].iconSrc,
      currentTotal,
      prevTotal,
      deltaAbs,
      deltaPercent,
    };
  });

  return {
    towns,
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
