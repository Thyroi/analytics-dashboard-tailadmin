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
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { matchCategoryId } from "@/lib/taxonomy/normalize";
import { getTownSearchPattern } from "@/lib/taxonomy/patterns";
import {
  TOWN_ID_ORDER,
  TOWN_META,
  TOWN_SYNONYMS,
  type TownId,
} from "@/lib/taxonomy/towns";
import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

/* ==================== Tipos ==================== */

export type TownCategoryData = {
  categoryId: CategoryId | "otros";
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
 * Normaliza texto para comparación (lowercase, sin acentos, sin guiones)
 */
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos
    .replace(/[._-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Construye índice de sinónimos para mapear tokens a CategoryId
 */
function buildCategorySynonymIndex(): Map<string, CategoryId> {
  const index = new Map<string, CategoryId>();

  for (const categoryId of CATEGORY_ID_ORDER) {
    // Agregar el ID mismo
    index.set(normalize(categoryId), categoryId);

    // Agregar label oficial
    index.set(normalize(CATEGORY_META[categoryId].label), categoryId);

    // Agregar todos los sinónimos
    const synonyms = CATEGORY_SYNONYMS[categoryId] || [];
    for (const synonym of synonyms) {
      index.set(normalize(synonym), categoryId);
    }
  }

  return index;
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
 * Parsea respuesta de Mindsaic y suma valores por categoría
 * Solo cuenta claves root.<townId>.<token> (profundidad 3)
 */
function buildTownSynonymIndex(): Map<string, TownId> {
  const index = new Map<string, TownId>();
  for (const townId of TOWN_ID_ORDER) {
    index.set(normalize(townId), townId);
    index.set(normalize(TOWN_META[townId].label), townId);
    const synonyms = TOWN_SYNONYMS[townId] || [];
    for (const s of synonyms) index.set(normalize(s), townId);
  }
  return index;
}

function parseTownCategories(
  response: MindsaicResponse,
  townId: TownId,
  categorySynIndex: Map<string, CategoryId>,
  townSynIndex: Map<string, TownId>
): Map<CategoryId | "otros", number> {
  const totals = new Map<CategoryId | "otros", number>();

  // Inicializar todas las categorías en 0
  for (const categoryId of CATEGORY_ID_ORDER) {
    totals.set(categoryId, 0);
  }
  totals.set("otros", 0);

  const output = response.output || {};

  let matchedAny = false;
  for (const [key, series] of Object.entries(output)) {
    const parts = key.split(".");
    if (parts.length !== 3) continue; // Solo profundidad 3
    const townToken = parts[1];
    const catToken = parts[2];
    if (!townToken || !catToken) continue;

    // Validar que el townToken pertenece al townId seleccionado
    const mappedTown = townSynIndex.get(normalize(townToken));
    if (mappedTown !== townId) continue;

    // Mapear token de categoría a CategoryId usando sinónimos
    const categoryId = categorySynIndex.get(normalize(catToken)) || "otros";

    // Sumar toda la serie
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);
    const currentTotal = totals.get(categoryId) || 0;
    totals.set(categoryId, currentTotal + total);
    matchedAny = true;
  }

  // Fallback: si no matcheó nada por sinónimos de pueblo, usar prefijo del patrón de búsqueda (token)
  if (!matchedAny) {
    const { token } = getTownSearchPattern(townId);
    const tokenNorm = normalize(token);
    for (const [key, series] of Object.entries(output)) {
      const parts = key.split(".");
      if (parts.length !== 3) continue;
      const townToken = parts[1];
      const catToken = parts[2];
      if (!townToken || !catToken) continue;
      const townNorm = normalize(townToken);
      if (!townNorm.startsWith(tokenNorm)) continue;

      const categoryId = categorySynIndex.get(normalize(catToken)) || "otros";
      const total = series.reduce((sum, point) => sum + (point.value || 0), 0);
      const currentTotal = totals.get(categoryId) || 0;
      totals.set(categoryId, currentTotal + total);
    }
  }

  return totals;
}

/**
 * Agrega totales diarios a nivel de town (profundidad 3) → { ISO: total }
 */
function aggregateDailyTotals(
  output: MindsaicOutput,
  townId: TownId,
  townSynIndex: Map<string, TownId>
): Map<string, number> {
  const totals = new Map<string, number>();

  let matchedAny = false;
  for (const [key, series] of Object.entries(output)) {
    const parts = key.split(".");
    if (parts.length !== 3) continue; // Solo profundidad 3
    const townToken = parts[1];
    if (!townToken) continue;
    const mappedTown = townSynIndex.get(normalize(townToken));
    if (mappedTown !== townId) continue;

    for (const point of series) {
      const y = point.time;
      if (!y || y.length !== 8) continue;
      const iso = `${y.slice(0, 4)}-${y.slice(4, 6)}-${y.slice(6, 8)}`;
      const prev = totals.get(iso) || 0;
      totals.set(iso, prev + (point.value || 0));
    }
    matchedAny = true;
  }

  // Fallback por prefijo del token si no hubo match por sinónimos
  if (!matchedAny) {
    const { token } = getTownSearchPattern(townId);
    const tokenNorm = normalize(token);
    for (const [key, series] of Object.entries(output)) {
      const parts = key.split(".");
      if (parts.length !== 3) continue;
      const townToken = parts[1];
      if (!townToken) continue;
      const townNorm = normalize(townToken);
      if (!townNorm.startsWith(tokenNorm)) continue;
      for (const point of series) {
        const y = point.time;
        if (!y || y.length !== 8) continue;
        const iso = `${y.slice(0, 4)}-${y.slice(4, 6)}-${y.slice(6, 8)}`;
        const prev = totals.get(iso) || 0;
        totals.set(iso, prev + (point.value || 0));
      }
    }
  }

  return totals;
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

      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + dayValue);
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

  // 2. Construir índice de sinónimos
  const categorySynonymIndex = buildCategorySynonymIndex();
  const townSynonymIndex = buildTownSynonymIndex();

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

    // 5. Parsear y sumar totales por categoría (depth=3)
    const currentTotals = parseTownCategories(
      currentResponse,
      townId,
      categorySynonymIndex,
      townSynonymIndex
    );
    const prevTotals = parseTownCategories(
      prevResponse,
      townId,
      categorySynonymIndex,
      townSynonymIndex
    );

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
    const otrosCurrentTotal = currentTotals.get("otros") || 0;
    const otrosPrevTotal = prevTotals.get("otros") || 0;
    if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
      categories.push({
        categoryId: "otros",
        label: "Otros",
        iconSrc: "/icons/otros.svg", // Placeholder
        currentTotal: otrosCurrentTotal,
        prevTotal: otrosPrevTotal,
        deltaAbs: otrosCurrentTotal - otrosPrevTotal,
        deltaPercent: computeDeltaPercent(otrosCurrentTotal, otrosPrevTotal),
      });
    }

    // 7. Series agregadas por día para el pueblo
    const currentTotalsByISO = aggregateDailyTotals(
      currentResponse.output || {},
      townId,
      townSynonymIndex
    );
    const prevTotalsByISO = aggregateDailyTotals(
      prevResponse.output || {},
      townId,
      townSynonymIndex
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

    return {
      townId,
      categories,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
      categoryRawSegmentsById,
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
