/**
 * Servicio para obtener breakdown de categorías dentro de un town específico
 *
 * NIVEL 1: Town → Categorías
 *
 * Reglas:
 * - Pattern: "root.<townId>.*" (solo ese town)
 * - Filtro: profundidad === 3 (root.<town>.<categoria>)
 * - POST dual: current + previous con granularity="d"
 * - Mapeo CATEGORY_SYNONYMS case-insensitive
 * - Renderizar TODAS las categorías (0 si no hay datos)
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 */

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { matchCategoryId } from "@/lib/taxonomy/normalize";
import {
  getTownSearchPattern,
  matchSecondCategory,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";
import { type TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";

/* ==================== Debug Flags ==================== */
const DEBUG_SERIES = false; // Cambiar a true para auditar el universo de claves y categorías detectadas

/* ==================== Tipos ==================== */

export type OthersBreakdownEntry = {
  key: string; // Clave original, e.g., "root.patrimonio.paterna.tejada la nueva"
  path: string[]; // Parts splitteadas, e.g., ["root", "patrimonio", "paterna", "tejada la nueva"]
  value: number; // Valor agregado (suma de todas las series)
  timePoints: Array<{ time: string; value: number }>; // Puntos individuales para debugging
};

export type TownCategoryData = {
  categoryId: CategoryId | typeof OTHERS_ID;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type TownCategoryBreakdownResponse = {
  townId: TownId;
  categories: TownCategoryData[];
  seriesByCategory?: Record<string, Array<{ time: string; value: number }>>; // Opcional para futura comparativa
  /** Series agregadas por día para el pueblo completo (para la gráfica de la izquierda) */
  series?: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  /** Raw segments observed grouped by canonical CategoryId with totals (to pick representative raw segment for Nivel 2) */
  categoryRawSegmentsById?: Record<CategoryId, Record<string, number>>;
  /** Desglose de claves que cayeron en "Otros" (no mapeables) */
  othersBreakdown?: {
    current: OthersBreakdownEntry[];
    previous: OthersBreakdownEntry[];
  };
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

export type FetchTownCategoryBreakdownParams = {
  townId: TownId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
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
 * Filtra y parsea el universo de claves que pertenecen a esta vista (town)
 * Devuelve KeyInfo[] con metadata completa para uso uniforme en donut y series
 *
 * Acepta profundidad >= 3 para incluir subcategorías (root.town.category.subcat)
 */
function collectKeyInfosForView(
  output: MindsaicOutput,
  townId: TownId
): KeyInfo[] {
  const { token: townToken, wildcard } = getTownSearchPattern(townId);
  const allKeys = Object.keys(output);
  const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];

  // Filtrar profundidad >= 3 y town matching en parts[1]
  return parsedKeys.filter((keyInfo) => {
    if (keyInfo.depth < 3) return false; // Mínimo root.town.category
    const townPart = keyInfo.parts[1];
    if (!townPart) return false;

    return wildcard
      ? keyInfo.normParts[1].startsWith(
          keyInfo.normParts[1].slice(0, townToken.length)
        )
      : keyInfo.parts[1].toLowerCase() === townToken.toLowerCase();
  });
}

/**
 * Parsea respuesta de Mindsaic usando helpers de profundidad
 * Filtra solo claves root.<town>.<categoria> (profundidad 3)
 * Ahora también recopila detalles de "Otros" para drill-down
 * Nota: A diferencia de categoryTownBreakdown, aquí el orden es town→category
 */
function parseTownCategories(
  response: MindsaicResponse,
  townId: TownId
): {
  totals: Map<CategoryId | typeof OTHERS_ID, number>;
  othersBreakdown: OthersBreakdownEntry[];
} {
  const totals = new Map<CategoryId | typeof OTHERS_ID, number>();
  const othersBreakdown: OthersBreakdownEntry[] = [];

  // Inicializar todas las categorías en 0
  for (const categoryId of CATEGORY_ID_ORDER) {
    totals.set(categoryId, 0);
  }
  totals.set(OTHERS_ID, 0);

  const output = response.output || {};

  // Usar universo filtrado unificado
  const matchedKeys = collectKeyInfosForView(output, townId);

  if (DEBUG_SERIES) {
    console.log(
      `[parseTownCategories] townId="${townId}" | universeCount=${matchedKeys.length}`
    );
    console.log(
      `[parseTownCategories] Keys:`,
      matchedKeys.map((k) => k.raw)
    );
  }

  // Filtrar por pueblo y mapear categorías
  for (const keyInfo of matchedKeys) {
    // Mapear categoría usando helper PARA TOWN-FIRST (parts[2])
    const categoryId = matchSecondCategory(keyInfo); // ← CAMBIO: usar matchSecondCategory

    if (DEBUG_SERIES) {
      console.log(
        `[parseTownCategories] Key: "${keyInfo.raw}" | parts[2]="${keyInfo.parts[2]}" | matched category="${categoryId}"`
      );
    }

    // Sumar toda la serie
    const series = output[keyInfo.raw] || [];
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);

    if (categoryId) {
      const prev = totals.get(categoryId) || 0;
      totals.set(categoryId, prev + total);
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
 * Agrega totales diarios a nivel de town (profundidad 3) → { ISO: total }
 * IMPORTANTE: Ahora usa el mismo universo filtrado que parseTownCategories (collectKeyInfosForView)
 */
function aggregateDailyTotals(
  output: MindsaicOutput,
  townId: TownId
): Map<string, number> {
  const totals = new Map<string, number>();

  // Usar mismo universo que donut/totals
  const matchedKeys = collectKeyInfosForView(output, townId);

  if (DEBUG_SERIES) {
    console.log(
      `[aggregateDailyTotals] townId="${townId}" | universeCount=${matchedKeys.length}`
    );
  }

  // Agregar valores por fecha
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
  townId: TownId,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const { token, wildcard } = getTownSearchPattern(townId);
  const payload = {
    db,
    // Patrón basado en token + wildcard condicional
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
 * Obtiene breakdown de categorías dentro de un town específico
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODAS las categorías aunque no tengan datos (0 y null).
 *
 * NIVEL 1: root.<townId>.<categoria> (profundidad 3)
 */
export async function fetchTownCategoryBreakdown(
  params: FetchTownCategoryBreakdownParams
): Promise<TownCategoryBreakdownResponse> {
  const {
    townId,
    windowGranularity = "d",
    startISO = null,
    endISO = null,
    db = "project_huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStartFormatted = formatDateForMindsaic(ranges.current.start);
  const currentEndFormatted = formatDateForMindsaic(ranges.current.end);
  const prevStartFormatted = formatDateForMindsaic(ranges.previous.start);
  const prevEndFormatted = formatDateForMindsaic(ranges.previous.end);

  // 3. Hacer dos POST paralelos con timeout 15s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const [currentResponse, prevResponse] = await Promise.all([
      fetchMindsaicData(
        townId,
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicData(
        townId,
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por categoría (depth=3) usando nuevos helpers
    const currentResult = parseTownCategories(currentResponse, townId);
    const prevResult = parseTownCategories(prevResponse, townId);

    const currentTotals = currentResult.totals;
    const prevTotals = prevResult.totals;

    // 5b. Construir mapa de raw segments por CategoryId para Nivel 2
    const categoryRawSegmentsById: Record<
      CategoryId,
      Record<string, number>
    > = {} as Record<CategoryId, Record<string, number>>;

    // Recorrer todas las claves de output y agrupar por categoryId
    const addRawToCategory = (key: string, total: number) => {
      const parts = key.split(".");
      if (parts.length !== 3) return; // only depth 3
      const rawSegment = parts[2];
      const catId = matchCategoryId(rawSegment) || ("otros" as CategoryId);
      categoryRawSegmentsById[catId] = categoryRawSegmentsById[catId] || {};
      const prev = categoryRawSegmentsById[catId][rawSegment] || 0;
      categoryRawSegmentsById[catId][rawSegment] = prev + total;
    };

    for (const [k, series] of Object.entries(currentResponse.output || {})) {
      // only depth 3
      const parts = k.split(".");
      if (parts.length !== 3) continue;
      const total = series.reduce((s, p) => s + (p.value || 0), 0);
      addRawToCategory(k, total);
    }

    // 6. Construir resultado final con TODAS las categorías (sin "otros" si está en 0)
    const categories: TownCategoryData[] = CATEGORY_ID_ORDER.map(
      (categoryId) => {
        const currentTotal = currentTotals.get(categoryId) || 0;
        const prevTotal = prevTotals.get(categoryId) || 0;
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
      }
    );

    // Agregar "otros" si tiene datos
    const otrosCurrentTotal = currentTotals.get(OTHERS_ID) || 0;
    const otrosPrevTotal = prevTotals.get(OTHERS_ID) || 0;
    if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
      categories.push({
        categoryId: OTHERS_ID,
        label: "Otros",
        iconSrc: "/icons/otros.svg", // Placeholder
        currentTotal: otrosCurrentTotal,
        prevTotal: otrosPrevTotal,
        deltaAbs: otrosCurrentTotal - otrosPrevTotal,
        deltaPercent: computeDeltaPercent(otrosCurrentTotal, otrosPrevTotal),
      });
    }

    // 7. Series agregadas por día para el pueblo usando nuevos helpers
    const currentTotalsByISO = aggregateDailyTotals(
      currentResponse.output || {},
      townId
    );
    const prevTotalsByISO = aggregateDailyTotals(
      prevResponse.output || {},
      townId
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
        `[fetchTownCategoryBreakdown] Series summary for townId="${townId}"`
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
      townId,
      categories,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
      categoryRawSegmentsById,
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
        `Timeout al consultar categorías del town ${townId} (15s)`
      );
    }

    throw error;
  }
}
