/**
 * Sistema de particionado para nivel 1 con detección automática de modo
 *
 * - town-first: Agrupa por pueblo, todo lo que no mapea va a "Otros"
 * - topic-first: Agrupa por subtemas (sin "Otros")
 *
 * IMPORTANTE:
 * - "Otros" es navegable y guarda todas las entries completas
 * - Sin useEffect: todo se dispara desde handlers
 * - Mismo universo para donut y series (sin divergencias)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import { matchCategoryId, matchTownId } from "@/lib/taxonomy/normalize";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";

/* ==================== Tipos ==================== */

export type RawPoint = { time: string; value: number };
export type RawSeriesByKey = Record<string, RawPoint[]>;

export type PartitionMode = "town-first" | "topic-first";

/**
 * Payload de "Otros" para drilldown
 * Contiene todas las claves que NO mapearon a pueblo
 */
export type OthersPayload = {
  /** Conjunto completo de claves y puntos que NO mapearon */
  entries: Array<{ key: string; points: RawPoint[] }>;
  /** Total agregado de todos los valores */
  total: number;
  /** Cantidad de claves distintas */
  distinctKeys: number;
};

/**
 * Resultado del particionado
 */
export type GroupedResult = {
  mode: PartitionMode;
  /** Grupos: nombre canónico → lista de entries */
  groups: Record<string, Array<{ key: string; points: RawPoint[] }>>;
  /** Solo si mode === "town-first" y hay claves no mapeadas */
  others?: OthersPayload;
};

/* ==================== Constantes ==================== */

export const OTHERS_ID = "__others__";
export const OTHERS_LABEL = "Otros";

/* ==================== Detección de Modo ==================== */

/**
 * Detecta automáticamente el modo de partición para una categoría
 *
 * Lógica:
 * - Si NINGUNA clave tiene pueblo en posición 2 → topic-first
 * - Si AL MENOS UNA clave tiene pueblo → town-first
 *
 * @param categoryId - ID de la categoría
 * @param data - Datos crudos del API
 * @returns Modo detectado
 */
export function detectPartitionModeForCategory(
  categoryId: CategoryId,
  data: RawSeriesByKey
): PartitionMode {
  let countTown = 0;

  for (const key of Object.keys(data)) {
    const parts = key.split(".");
    if (parts[0] !== "root") continue;

    // Verificar que la categoría coincida
    const catToken = parts[1] || "";
    const catId = matchCategoryId(catToken);
    if (catId !== categoryId) continue;

    // Token candidato inmediatamente después de la categoría
    const maybeToken = parts[2] || "";
    if (!maybeToken) continue;

    // Intentar mapear a pueblo
    const townId = matchTownId(maybeToken);
    if (townId) countTown++;
  }

  // Si no hay ningún pueblo → topic-first
  return countTown === 0 ? "topic-first" : "town-first";
}

/* ==================== Particionado ==================== */

/**
 * Particiona entries de una categoría en grupos
 *
 * town-first:
 * - Agrupa por pueblo (townId canónico)
 * - Claves sin pueblo → "Otros" (guardadas completas para drilldown)
 *
 * topic-first:
 * - Agrupa por subtema (token en posición 2)
 * - No genera "Otros"
 *
 * @param categoryId - ID de la categoría
 * @param data - Datos crudos del API
 * @returns Resultado del particionado con grupos y posible "Otros"
 */
export function partitionCategoryEntries(
  categoryId: CategoryId,
  data: RawSeriesByKey
): GroupedResult {
  const mode = detectPartitionModeForCategory(categoryId, data);
  const groups: GroupedResult["groups"] = {};
  const othersEntries: Array<{ key: string; points: RawPoint[] }> = [];

  for (const [key, points] of Object.entries(data)) {
    const parts = key.split(".");
    if (parts[0] !== "root") continue;

    // Verificar categoría
    const catToken = parts[1] || "";
    const catId = matchCategoryId(catToken);
    if (catId !== categoryId) continue;

    // Token en posición 2
    const token2 = parts[2] || "";
    if (!token2) continue;

    if (mode === "topic-first") {
      // Agrupa por subtema (normalizado)
      const groupName = normalizeGroupName(token2);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push({ key, points });
    } else {
      // town-first: intenta mapear a pueblo
      const townId = matchTownId(token2);
      if (townId) {
        // Usa townId canónico como clave de grupo
        if (!groups[townId]) groups[townId] = [];
        groups[townId].push({ key, points });
      } else {
        // NO mapeó → guardar en "Otros"
        othersEntries.push({ key, points });
      }
    }
  }

  // Si hay entries en "Otros", crear payload
  if (mode === "town-first" && othersEntries.length > 0) {
    return {
      mode,
      groups,
      others: {
        entries: othersEntries,
        total: sumEntries(othersEntries),
        distinctKeys: othersEntries.length,
      },
    };
  }

  return { mode, groups };
}

/* ==================== Helpers ==================== */

/**
 * Normaliza nombre de grupo (para topic-first)
 */
function normalizeGroupName(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Suma total de valores de un conjunto de entries
 */
function sumEntries(
  entries: Array<{ key: string; points: RawPoint[] }>
): number {
  let total = 0;
  for (const entry of entries) {
    for (const point of entry.points) {
      total += point.value || 0;
    }
  }
  return total;
}

/**
 * Obtiene label legible para un grupo
 *
 * @param groupId - ID del grupo (townId o subtema normalizado)
 * @param mode - Modo de partición
 * @returns Label formateado
 */
export function getGroupLabel(groupId: string, mode: PartitionMode): string {
  if (groupId === OTHERS_ID) {
    return OTHERS_LABEL;
  }

  if (mode === "town-first") {
    // groupId es un townId → usar label oficial
    const meta = TOWN_META[groupId as TownId];
    return meta ? meta.label : toTitle(groupId);
  }

  // topic-first: capitalizar subtema
  return toTitle(groupId.replace(/_/g, " "));
}

/**
 * Capitaliza primera letra de cada palabra
 */
function toTitle(s: string): string {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Extrae el "leaf" (último token significativo) de una clave
 * Útil para nivel 2 de "Otros"
 *
 * @param key - Clave completa (ej: "root.patrimonio.paterna.tejada la nueva")
 * @returns Último token (ej: "tejada_la_nueva")
 */
export function extractLeaf(key: string): string {
  const parts = key
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);

  // Eliminar "root" y considerar desde posición 1 (categoría)
  const body = parts.slice(2); // Omite "root" y categoría

  // Filtrar tokens vacíos
  const filtered = body.filter((p) => p.length > 0);

  if (filtered.length === 0) return "otros";

  // Último token normalizado
  const leaf = filtered[filtered.length - 1];
  return normalizeGroupName(leaf);
}

/**
 * Agrupa entries por leaf (para nivel 2)
 */
export function groupByLeaf(
  entries: Array<{ key: string; points: RawPoint[] }>
): Record<string, Array<{ key: string; points: RawPoint[] }>> {
  const result: Record<string, Array<{ key: string; points: RawPoint[] }>> = {};

  for (const entry of entries) {
    const leaf = extractLeaf(entry.key);
    if (!result[leaf]) result[leaf] = [];
    result[leaf].push(entry);
  }

  return result;
}

/**
 * Obtiene total por grupo para donut
 */
export function getTotalsByGroup(
  groups: Record<string, Array<{ key: string; points: RawPoint[] }>>
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const [groupId, entries] of Object.entries(groups)) {
    totals[groupId] = sumEntries(entries);
  }

  return totals;
}
