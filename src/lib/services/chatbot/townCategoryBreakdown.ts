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
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
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
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
};

export type FetchTownCategoryBreakdownParams = {
  townId: TownId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
};

type MindsaicPoint = { time: string; value: number };
type MindsaicOutput = Record<string, MindsaicPoint[]>;
type MindsaicResponse = {
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
function parseTownCategories(
  response: MindsaicResponse,
  townId: TownId,
  synonymIndex: Map<string, CategoryId>
): Map<CategoryId | "otros", number> {
  const totals = new Map<CategoryId | "otros", number>();

  // Inicializar todas las categorías en 0
  for (const categoryId of CATEGORY_ID_ORDER) {
    totals.set(categoryId, 0);
  }
  totals.set("otros", 0);

  const output = response.output || {};
  const prefix = `root.${townId}.`;

  for (const [key, series] of Object.entries(output)) {
    // Solo procesar claves root.<townId>.<token> (profundidad 3)
    if (!key.startsWith(prefix)) continue;

    const parts = key.split(".");
    if (parts.length !== 3) continue; // Ignorar subniveles (profundidad != 3)

    const token = parts[2];
    if (!token) continue;

    // Mapear token a CategoryId usando sinónimos
    const normalizedToken = normalize(token);
    const categoryId = synonymIndex.get(normalizedToken) || "otros";

    // Sumar toda la serie
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);
    const currentTotal = totals.get(categoryId) || 0;
    totals.set(categoryId, currentTotal + total);
  }

  return totals;
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
  const payload = {
    db,
    patterns: `root.${townId}.*`, // Pattern específico del town
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
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
  const synonymIndex = buildCategorySynonymIndex();

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

    // 5. Parsear y sumar totales por categoría
    const currentTotals = parseTownCategories(
      currentResponse,
      townId,
      synonymIndex
    );
    const prevTotals = parseTownCategories(prevResponse, townId, synonymIndex);

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

    return {
      townId,
      categories,
      meta: {
        granularity: windowGranularity,
        timezone: "UTC",
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
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
