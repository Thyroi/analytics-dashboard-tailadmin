// lib/utils/aggregateCategories.ts
import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { toTokens } from "@/lib/utils/string";

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
  const tokenMap = buildCategoryTokenMap();

  // acumuladores por categoría
  const totals = new Map<CategoryId, { value: number; delta: number }>();

  // Recorremos cada clave del API (p.ej. "root.playas", "root.Playas", etc.)
  for (const [rawKey, points] of Object.entries(apiOutput)) {
    // recorta prefijo "root." si viene
    const keyNoRoot = rawKey.startsWith("root.") ? rawKey.slice(5) : rawKey;
    const tokens = toTokens(keyNoRoot);

    // generamos tokens y buscamos el primer match con alguna categoría
    let matched: CategoryId | null = null;
    for (const t of tokens) {
      const cid = tokenMap.get(t);
      if (cid) {
        matched = cid;
        break;
      }
    }

    if (!matched) {
      continue; // no es una categoría conocida → ignorar (evita pueblos)
    }

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
