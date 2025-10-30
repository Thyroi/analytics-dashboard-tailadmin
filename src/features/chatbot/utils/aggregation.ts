import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { approxEquals, normalizeToken } from "@/lib/utils/string/normalize";
import { debugTokenMap as debugTokenMapUtil } from "@/lib/utils/taxonomy/categoryTokenMap";
import { fetchTagAudit } from "../services/tagAudit";
import type {
  ChatbotCardData,
  DrilldownData,
  Granularity,
  TagAuditResponse,
} from "../types";

/** ==== Tipos del API Mindsaic (lo necesario) ==== */
type APIPoint = { time: string; value: number };
type APIOutput = Record<string, APIPoint[]>; // las keys vienen como "root.*"

/** ==== Salida para UI ==== */
export type CategoryAggUI = {
  id: CategoryId;
  label: string;
  value: number;
  delta: number;
};

// Construye índice de sinónimos normalizados por categoría
function buildSynonymIndex(
  SYNONYMS: Record<CategoryId, string[]>
): Array<{ cid: CategoryId; syn: string }> {
  const out: Array<{ cid: CategoryId; syn: string }> = [];
  (Object.keys(SYNONYMS) as CategoryId[]).forEach((cid) => {
    SYNONYMS[cid].forEach((s) => out.push({ cid, syn: normalizeToken(s) }));
  });
  return out;
}

// Extrae los 2 primeros segmentos tras "root."
function firstTwoSegments(rawKey: string): { seg1: string; seg2: string } {
  const keyNoRoot = rawKey.startsWith("root.") ? rawKey.slice(5) : rawKey;
  const parts = keyNoRoot.split(".");
  return { seg1: parts[0] ?? "", seg2: parts[1] ?? "" };
}

/** Función de debug para ver el tokenMap completo */
export function debugTokenMap(): {
  tokenMap: Map<string, CategoryId>;
  tokensByCategory: Record<string, string[]>;
  totalTokens: number;
} {
  return debugTokenMapUtil();
}

/** Suma segura */
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

/** Delta = último - penúltimo; si hay 0/1 puntos, delta = 0 */
function seriesDelta(points: APIPoint[]): number {
  if (!points || points.length < 2) return 0;
  // Aseguramos orden por time ascendente
  const sorted = [...points].sort((a, b) => a.time.localeCompare(b.time));
  const last = sorted[sorted.length - 1]?.value ?? 0;
  const prev = sorted[sorted.length - 2]?.value ?? 0;
  return (Number(last) || 0) - (Number(prev) || 0);
}

/**
 * Agrega la respuesta del API por categoría, usando sinónimos.
 * - Filtra sólo lo que matchea categorías (no mezcla pueblos).
 * - value: suma de todos los values de las series que matchean esa categoría.
 * - delta: suma de los deltas (último - penúltimo) de cada serie de esa categoría.
 */
export function aggregateCategoriesForUI(
  apiOutput: APIOutput
): CategoryAggUI[] {
  const totals = new Map<CategoryId, { value: number; delta: number }>();
  const idx = buildSynonymIndex(CATEGORY_SYNONYMS);

  // Recorremos cada clave del API usando la nueva lógica de matching
  for (const [rawKey, points] of Object.entries(apiOutput)) {
    const { seg1, seg2 } = firstTwoSegments(rawKey);
    const s1 = normalizeToken(seg1);
    const s2 = normalizeToken(seg2);

    let matched: CategoryId | null = null;

    // Prioriza match en seg1; si no, intenta en seg2
    for (const { cid, syn } of idx) {
      if (approxEquals(s1, syn)) {
        matched = cid;
        break;
      }
    }
    if (!matched) {
      for (const { cid, syn } of idx) {
        if (approxEquals(s2, syn)) {
          matched = cid;
          break;
        }
      }
    }

    if (!matched) continue; // no es una categoría conocida → ignorar (evita pueblos)

    // suma de la serie y delta de la serie
    const valueSum = sum(points.map((p) => Number(p.value) || 0));
    const dlt = seriesDelta(points);

    const prev = totals.get(matched) ?? { value: 0, delta: 0 };
    totals.set(matched, {
      value: prev.value + valueSum,
      delta: prev.delta + dlt,
    });
  }

  // construimos salida UI
  const result: CategoryAggUI[] = [];
  for (const [cid, agg] of totals.entries()) {
    const { label } = CATEGORY_META[cid];
    result.push({ id: cid, label, value: agg.value, delta: agg.delta });
  }

  // opcional: ordenar por value desc
  result.sort((a, b) => b.value - a.value);

  return result;
}

/**
 * Versión con debug de aggregateCategoriesForUI para troubleshooting
 */
export function aggregateCategoriesForUIWithDebug(apiOutput: APIOutput): {
  result: CategoryAggUI[];
  debug: {
    rawKeys: string[];
    matchedKeys: string[];
    unmatchedKeys: string[];
    tokenMatches: Array<{
      key: string;
      seg1: string;
      seg2: string;
      matched: CategoryId | null;
      matchedOn: "seg1" | "seg2" | null;
      matchedSynonym?: string;
    }>;
  };
} {
  const debug = {
    rawKeys: Object.keys(apiOutput),
    matchedKeys: [] as string[],
    unmatchedKeys: [] as string[],
    tokenMatches: [] as Array<{
      key: string;
      seg1: string;
      seg2: string;
      matched: CategoryId | null;
      matchedOn: "seg1" | "seg2" | null;
      matchedSynonym?: string;
    }>,
  };

  const totals = new Map<CategoryId, { value: number; delta: number }>();
  const idx = buildSynonymIndex(CATEGORY_SYNONYMS);

  for (const [rawKey, points] of Object.entries(apiOutput)) {
    const { seg1, seg2 } = firstTwoSegments(rawKey);
    const s1 = normalizeToken(seg1);
    const s2 = normalizeToken(seg2);

    let matched: CategoryId | null = null;
    let matchedOn: "seg1" | "seg2" | null = null;
    let matchedSynonym: string | undefined;

    for (const { cid, syn } of idx) {
      if (approxEquals(s1, syn)) {
        matched = cid;
        matchedOn = "seg1";
        matchedSynonym = syn;
        break;
      }
    }
    if (!matched) {
      for (const { cid, syn } of idx) {
        if (approxEquals(s2, syn)) {
          matched = cid;
          matchedOn = "seg2";
          matchedSynonym = syn;
          break;
        }
      }
    }

    debug.tokenMatches.push({
      key: rawKey,
      seg1,
      seg2,
      matched,
      matchedOn,
      matchedSynonym,
    });

    if (!matched) {
      debug.unmatchedKeys.push(rawKey);
      continue;
    }
    debug.matchedKeys.push(rawKey);

    const valueSum = sum(points.map((p) => Number(p.value) || 0));
    const dlt = seriesDelta(points);

    const prev = totals.get(matched) ?? { value: 0, delta: 0 };
    totals.set(matched, {
      value: prev.value + valueSum,
      delta: prev.delta + dlt,
    });
  }

  const result: CategoryAggUI[] = [];
  for (const [cid, agg] of totals.entries()) {
    const { label } = CATEGORY_META[cid];
    result.push({ id: cid, label, value: agg.value, delta: agg.delta });
  }
  result.sort((a, b) => b.value - a.value);

  return { result, debug };
}

/**
 * Función para compatibilidad con el hook existente
 * Convierte datos del API al formato ChatbotCardData esperado por el hook
 */
export function processCategories(
  response: TagAuditResponse,
  categories: string[],
  _currentStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _currentEnd: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousEnd: string // eslint-disable-line @typescript-eslint/no-unused-vars
): ChatbotCardData[] {
  // Usar la función robusta que ya tienes
  const aggregatedData = aggregateCategoriesForUI(response.output);

  // Convertir al formato esperado por el hook
  return aggregatedData
    .filter((item) => categories.length === 0 || categories.includes(item.id))
    .map((item) => ({
      id: item.id,
      label: item.label,
      pattern: item.id,
      currentTotal: item.value,
      prevTotal: Math.max(0, item.value - item.delta), // Calcular valor anterior
      deltaAbs: item.delta,
      deltaPct:
        item.value > 0
          ? (item.delta / Math.max(1, item.value - item.delta)) * 100
          : null,
    }));
}

/**
 * Función placeholder para pueblos
 */
export function processTowns(
  _response: TagAuditResponse, // eslint-disable-line @typescript-eslint/no-unused-vars
  _towns: string[], // eslint-disable-line @typescript-eslint/no-unused-vars
  _currentStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _currentEnd: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousEnd: string // eslint-disable-line @typescript-eslint/no-unused-vars
): ChatbotCardData[] {
  // TODO: Implementar lógica de pueblos
  return [];
}

/**
 * Función placeholder para drilldown
 */
export function generateDrilldownData(
  _response: TagAuditResponse,
  itemId: string,
  _itemLabel: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _mode: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _currentStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _currentEnd: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousStart: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _previousEnd: string // eslint-disable-line @typescript-eslint/no-unused-vars
): DrilldownData {
  return {
    id: itemId,
    label: itemId,
    pattern: itemId,
    currentSeries: [],
    previousSeries: [],
    donutData: [],
    currentTotal: 0,
    prevTotal: 0,
  };
}

/**
 * Función para hacer drilldown independiente con query específica
 * Hace una query con pattern "root.{categoria}.*" para obtener todos los datos relacionados
 */
export async function fetchDrilldownData(
  categoryId: CategoryId,
  granularity: Granularity,
  startTime: string,
  endTime: string
): Promise<{
  category: CategoryId;
  pattern: string;
  rawData: TagAuditResponse;
  processedData: Array<{ key: string; time: string; value: number }>;
  totalValue: number;
  dataPointsCount: number;
}> {
  // Crear el pattern específico para la categoría con wildcard
  const pattern = `root.${categoryId}.*`;

  try {
    // Hacer la query específica para esta categoría
    const response = await fetchTagAudit({
      patterns: pattern,
      granularity,
      startTime,
      endTime,
    });

    // Procesar TODOS los datos que matchean el pattern
    const processedData: Array<{ key: string; time: string; value: number }> =
      [];
    let totalValue = 0;
    let dataPointsCount = 0;

    // Recorrer todas las keys de la respuesta
    Object.entries(response.output).forEach(([key, points]) => {
      if (Array.isArray(points)) {
        points.forEach((point) => {
          processedData.push({
            key,
            time: point.time,
            value: point.value,
          });
          totalValue += Number(point.value) || 0;
          dataPointsCount++;
        });
      }
    });

    return {
      category: categoryId,
      pattern,
      rawData: response,
      processedData,
      totalValue,
      dataPointsCount,
    };
  } catch (error) {
    throw error;
  }
}
