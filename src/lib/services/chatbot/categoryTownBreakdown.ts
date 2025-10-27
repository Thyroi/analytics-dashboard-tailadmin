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
import {
  getCategorySearchPattern,
  makeCategoryFilter,
  matchSecondTown,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";

/* ==================== Debug Flags ==================== */
const DEBUG_SERIES = false; // Cambiar a true para auditar el universo de claves y series

/* ==================== Tipos ==================== */

/** Detalle de una entrada en "Otros" */
export type OthersBreakdownEntry = {
  key: string; // Clave completa "root.patrimonio.paterna.tejada la nueva"
  path: string[]; // ["root", "patrimonio", "paterna", "tejada la nueva"]
  value: number; // Suma total de esta clave
  timePoints: Array<{ time: string; value: number }>; // Puntos temporales originales
};

export type CategoryTownData = {
  townId: TownId | typeof OTHERS_ID;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type CategoryTownBreakdownResponse = {
  categoryId: CategoryId;
  towns: CategoryTownData[];
  /** Desglose detallado de "Otros" para drill-down */
  othersBreakdown?: {
    current: OthersBreakdownEntry[];
    previous: OthersBreakdownEntry[];
  };
  seriesByTown?: Record<string, Array<{ time: string; value: number }>>; // Opcional para futura comparativa
  /** Series agregadas por día para la categoría completa (para la gráfica de la izquierda) */
  series?: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  /** Raw segments observed grouped by canonical TownId with totals (to pick representative raw segment for Nivel 2) */
  townRawSegmentsById?: Record<TownId, Record<string, number>>;
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
  /** Opcional: respuestas crudas del origen (solo para debug del nivel 1) */
  raw?: {
    current: MindsaicResponse;
    previous: MindsaicResponse;
  };
};

export type FetchCategoryTownBreakdownParams = {
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  /** Optional: representative raw segment token for the category */
  representativeCategoryRaw?: string | null;
};

export type MindsaicPoint = { time: string; value: number };
export type MindsaicOutput = Record<string, MindsaicPoint[]>;
export type MindsaicResponse = {
  code: number;
  output: MindsaicOutput;
};

/* ==================== Helpers ==================== */

/**
 * Convierte formato YYYY-MM-DD a YYYYMMDD requerido por Mindsaic
 */
function formatDateForMindsaic(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

/**
 * Calcula deltaPercent según reglas:
 * - null si prev <= 0 o falta dato
 * - ((current - prev) / prev) * 100 en otro caso
 */
function computeDeltaPercent(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

/**
 * Filtra y parsea el universo de claves que pertenecen a esta vista
 * Devuelve KeyInfo[] con metadata completa para uso uniforme en donut y series
 */
function collectKeyInfosForView(
  output: MindsaicOutput,
  categoryId: CategoryId
): KeyInfo[] {
  const categoryFilter = makeCategoryFilter(categoryId, 3);
  const allKeys = Object.keys(output);
  const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];
  return parsedKeys.filter(categoryFilter);
}

/**
 * Parsea respuesta de Mindsaic usando helpers de profundidad
 * Filtra solo claves root.<categoria>.<town> (profundidad 3)
 * Ahora también recopila detalles de "Otros" para drill-down
 */
function parseCategoryTowns(
  response: MindsaicResponse,
  categoryId: CategoryId
): {
  totals: Map<TownId | typeof OTHERS_ID, number>;
  othersBreakdown: OthersBreakdownEntry[];
} {
  const totals = new Map<TownId | typeof OTHERS_ID, number>();
  const othersBreakdown: OthersBreakdownEntry[] = [];

  // Inicializar todos los towns en 0
  for (const townId of TOWN_ID_ORDER) {
    totals.set(townId, 0);
  }
  totals.set(OTHERS_ID, 0);

  const output = response.output || {};

  // Usar universo filtrado unificado
  const matchedKeys = collectKeyInfosForView(output, categoryId);

  if (DEBUG_SERIES) {
    console.log(
      `[parseCategoryTowns] categoryId="${categoryId}" | universeCount=${matchedKeys.length}`
    );
    console.log(
      `[parseCategoryTowns] Keys:`,
      matchedKeys.map((k) => k.raw)
    );
  }

  // Sumar valores por pueblo y capturar "Otros"
  for (const keyInfo of matchedKeys) {
    const townId = matchSecondTown(keyInfo);
    const series = output[keyInfo.raw] || [];
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);

    if (townId) {
      const prev = totals.get(townId) || 0;
      totals.set(townId, prev + total);
    } else {
      // No se pudo mapear → "Otros"
      const prev = totals.get(OTHERS_ID) || 0;
      totals.set(OTHERS_ID, prev + total);

      // Capturar detalle para drill-down
      othersBreakdown.push({
        key: keyInfo.raw,
        path: keyInfo.parts,
        value: total,
        timePoints: series.map((pt) => ({ time: pt.time, value: pt.value })),
      });
    }
  }

  return { totals, othersBreakdown };
}

/**
 * Agrega totales diarios a nivel de category (profundidad 3) → { ISO: total }
 * IMPORTANTE: Ahora usa el mismo universo filtrado que parseCategoryTowns (collectKeyInfosForView)
 */
function aggregateDailyTotals(
  output: MindsaicOutput,
  categoryId: CategoryId
): Map<string, number> {
  const totals = new Map<string, number>();

  // Usar mismo universo que donut/totals
  const matchedKeys = collectKeyInfosForView(output, categoryId);

  if (DEBUG_SERIES) {
    console.log(
      `[aggregateDailyTotals] categoryId="${categoryId}" | universeCount=${matchedKeys.length}`
    );
  }

  // Agregar por fecha
  for (const keyInfo of matchedKeys) {
    const series = output[keyInfo.raw] || [];
    for (const point of series) {
      const y = point.time;
      if (!y || y.length !== 8) continue;
      const iso = `${y.slice(0, 4)}-${y.slice(4, 6)}-${y.slice(6, 8)}`;
      const prev = totals.get(iso) || 0;
      totals.set(iso, prev + (point.value || 0));
    }
  }

  return totals;
}

/**  return totals;
}

/**
 * Construye SeriesPoint[] completos para un rango [start..end] inclusivo usando un mapa { ISO → total }.
 * Garantiza que cada día del rango tenga un punto (0 si no hay datos).
 */
/**
 * Construye una serie temporal a partir de totales diarios
 *
 * Para granularidad "y": Agrupa por mes (YYYY-MM) con 12 buckets
 * Para otras granularidades: Un punto por día (YYYY-MM-DD)
 */
function buildSeriesForRange(
  totalsByISO: Map<string, number>,
  startISO: string,
  endISO: string,
  windowGranularity: WindowGranularity = "d"
): SeriesPoint[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  // Para granularidad anual: Agrupar por mes
  if (windowGranularity === "y") {
    const monthlyTotals = new Map<string, number>();

    // Iterar todos los días y agrupar por mes
    for (
      let d = new Date(start.getTime());
      d.getTime() <= end.getTime();
      d = addDaysUTC(d, 1)
    ) {
      const iso = toISO(d);
      const monthKey = iso.substring(0, 7); // YYYY-MM
      const dayValue = totalsByISO.get(iso) || 0;

      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) || 0) + dayValue
      );
    }

    // Convertir a array y ordenar
    const months: SeriesPoint[] = Array.from(monthlyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));

    return months;
  }

  // Para otras granularidades: Un punto por día
  const days: SeriesPoint[] = [];
  for (
    let d = new Date(start.getTime());
    d.getTime() <= end.getTime();
    d = addDaysUTC(d, 1)
  ) {
    const iso = toISO(d);
    days.push({ label: iso, value: totalsByISO.get(iso) || 0 });
  }

  return days;
}

/**
 * Hace un POST a /api/chatbot/audit/tags con los parámetros dados
 */
async function fetchMindsaicData(
  categoryId: CategoryId,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const { token, wildcard } = getCategorySearchPattern(categoryId);
  const payload = {
    db,
    patterns: `root.${token}${wildcard ? "*" : ""}.*`,
    granularity: "d", // Siempre "d" para Mindsaic
    startTime,
    endTime,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as MindsaicResponse;
  return json;
}

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
      fetchMindsaicData(
        categoryId,
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicData(
        categoryId,
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por town (depth=3) usando nuevos helpers
    const currentResult = parseCategoryTowns(currentResponse, categoryId);
    const prevResult = parseCategoryTowns(prevResponse, categoryId);

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

    // 7. Series agregadas por día para la categoría usando nuevos helpers
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
