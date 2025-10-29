/**
 * Servicio para obtener totales + deltas de categorías del chatbot
 *
 * Reglas:
 * - POST dual: current + previous con granularity="d" (Mindsaic)
 * - Pattern único: "root.*.*"
 * - Totales por categoría = solo root.<token> (profundidad 2)
 * - Mapeo de sinónimos case-insensitive
 * - Renderizar TODAS las categorías (0 si no hay datos)
 * - null conservado (no convertir a 0)
 * - TZ = UTC, end = ayer por defecto
 * - Timeout 15s con AbortController
 */

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

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
    current: MindsaicResponse;
    previous: MindsaicResponse;
  };
};

export type FetchCategoryTotalsParams = {
  granularity?: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
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
 * Solo cuenta claves root.<token> (profundidad 2)
 */
function parseCategoryTotals(
  response: MindsaicResponse,
  synonymIndex: Map<string, CategoryId>
): Map<CategoryId, number> {
  const totals = new Map<CategoryId, number>();

  // Inicializar todas las categorías en 0
  for (const categoryId of CATEGORY_ID_ORDER) {
    totals.set(categoryId, 0);
  }

  const output = response.output || {};

  for (const [key, series] of Object.entries(output)) {
    // Solo procesar claves root.<token> (profundidad 2)
    if (!key.startsWith("root.")) continue;

    const parts = key.split(".");
    if (parts.length !== 2) continue; // Ignorar subniveles

    const token = parts[1];
    if (!token) continue;

    // Mapear token a CategoryId usando sinónimos
    const normalizedToken = normalize(token);
    const categoryId = synonymIndex.get(normalizedToken);

    if (!categoryId) {
      // Token no reconocido, ignorar
      continue;
    }

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
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const payload = {
    db,
    patterns: "root.*.*", // Solo patrón root.<token>
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
 * Obtiene totales y deltas de todas las categorías del chatbot
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODAS las categorías aunque no tengan datos (0 y null).
 */
export async function fetchChatbotCategoryTotals(
  params: FetchCategoryTotalsParams = {}
): Promise<CategoryTotalsResponse> {
  const {
    granularity = "d",
    startDate = null,
    endDate = null,
    db = "project_huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(granularity, startDate, endDate);

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
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicData(
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por categoría
    const currentTotals = parseCategoryTotals(currentResponse, synonymIndex);
    const prevTotals = parseCategoryTotals(prevResponse, synonymIndex);

    // 6. Construir resultado final con TODAS las categorías (excepto "otros")
    const categories: CategoryTotalData[] = CATEGORY_ID_ORDER.filter(
      (id) => id !== "otros"
    ).map((categoryId) => {
      const currentTotal = currentTotals.get(categoryId) || 0;
      const prevTotal = prevTotals.get(categoryId) || 0;
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
    });

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
        current: currentResponse,
        previous: prevResponse,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout al consultar categorías del chatbot (15s)");
    }

    throw error;
  }
}
