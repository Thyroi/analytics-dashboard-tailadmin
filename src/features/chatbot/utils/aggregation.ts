import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
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

// Helpers de normalización y fuzzy match (sin dependencias)
function removeDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function collapseRepeats(s: string): string {
  // colapsa repeticiones de la misma letra: "plaaya" -> "playa"
  return s.replace(/([a-z0-9])\1+/gi, "$1");
}

function normalizeToken(s: string): string {
  const noDiac = removeDiacritics(s.toLowerCase());
  // quitar separadores comunes y espacios
  const compact = noDiac.replace(/[-_\s]+/g, "");
  return collapseRepeats(compact);
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // delete
        dp[i][j - 1] + 1,      // insert
        dp[i - 1][j - 1] + cost, // substitute
      );
    }
  }
  return dp[m][n];
}

function sameLettersLoose(a: string, b: string, slack: number): boolean {
  // compara multiconjuntos de letras (orden no importa) con tolerancia `slack`
  const count = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (const ch of s) m.set(ch, (m.get(ch) ?? 0) + 1);
    return m;
  };
  const ca = count(a);
  const cb = count(b);
  const allKeys = new Set([...ca.keys(), ...cb.keys()]);
  let diff = 0;
  for (const k of allKeys) {
    diff += Math.abs((ca.get(k) ?? 0) - (cb.get(k) ?? 0));
    if (diff > slack) return false;
  }
  return true;
}

function approxEquals(aRaw: string, bRaw: string): boolean {
  const a = normalizeToken(aRaw);
  const b = normalizeToken(bRaw);
  if (!a || !b) return false;
  if (a === b) return true;

  // umbral según longitud
  const len = Math.max(a.length, b.length);
  const thr = len <= 5 ? 1 : len <= 9 ? 2 : 3;

  // distancia de edición
  if (editDistance(a, b) <= thr) return true;

  // igualdad por multiconjunto de letras con pequeña holgura
  if (sameLettersLoose(a, b, Math.min(2, thr))) return true;

  // contención (para casos como "museo" vs "museos")
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}

// Construye índice de sinónimos normalizados por categoría
function buildSynonymIndex(
  SYNONYMS: Record<CategoryId, string[]>,
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



/** Normaliza y tokeniza para matching robusto (sin acentos, minúsculas) */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function toTokens(base: string): string[] {
  const n = norm(base);
  // variantes útiles: tal cual, espacios→-, espacios→_, sin separadores
  const kebab = n.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const snake = n.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const compact = n.replace(/[^a-z0-9]+/g, "");
  // set para evitar duplicados
  return Array.from(new Set([n, kebab, snake, compact].filter(Boolean)));
}

/** Construye un diccionario token -> CategoryId a partir de tus metadatos */
function buildCategoryTokenMap(): Map<string, CategoryId> {
  const map = new Map<string, CategoryId>();
  (Object.keys(CATEGORY_META) as CategoryId[]).forEach((cid) => {
    const meta = CATEGORY_META[cid];
    const syns = CATEGORY_SYNONYMS[cid] ?? [];
    const baseTokens = [
      ...toTokens(cid), // id
      ...toTokens(meta.label), // label UI
      ...syns.flatMap(toTokens), // sinónimos
    ];
    for (const t of baseTokens) map.set(t, cid);
  });
  return map;
}

/** Función de debug para ver el tokenMap completo */
export function debugTokenMap(): {
  tokenMap: Map<string, CategoryId>;
  tokensByCategory: Record<string, string[]>;
  totalTokens: number;
} {
  const map = buildCategoryTokenMap();
  const tokensByCategory: Record<string, string[]> = {};

  // Agrupar tokens por categoría
  for (const [token, categoryId] of map.entries()) {
    if (!tokensByCategory[categoryId]) {
      tokensByCategory[categoryId] = [];
    }
    tokensByCategory[categoryId].push(token);
  }

  return {
    tokenMap: map,
    tokensByCategory,
    totalTokens: map.size,
  };
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
export function aggregateCategoriesForUIWithDebug(
  apiOutput: APIOutput,
): {
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

  console.log(`🎯 DRILLDOWN - Haciendo query para categoría: ${categoryId}`);
  console.log(`📡 Pattern: ${pattern}`);
  console.log(`⏰ Período: ${startTime} - ${endTime}`);

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

    console.log(`✅ DRILLDOWN - Datos obtenidos para ${categoryId}:`, {
      pattern,
      matchedKeys: Object.keys(response.output),
      totalDataPoints: dataPointsCount,
      totalValue,
      keysFound: Object.keys(response.output).length,
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
    console.error(
      `❌ DRILLDOWN - Error al obtener datos para ${categoryId}:`,
      error
    );
    throw error;
  }
}
