/**
 * Colector centralizado del universo de claves para vistas de chatbot
 *
 * PRINCIPIO: Una sola fuente de verdad para el filtrado de claves
 * - Donut y series DEBEN usar el mismo universo
 * - "Otros" en nivel 1 navega a nivel 2 con othersOnly=true
 * - Nivel 3 nunca genera "Otros" (solo leaf labels)
 *
 * NIVELES:
 * - Nivel 0: depth=2 (root.<cat>)
 * - Nivel 1: depth=3 (root.<cat>.<town> o root.<town>.<cat>)
 * - Nivel 2: depth=4 (root.<cat>.<town>.<subcat>)
 * - Nivel 3: leaf labels (último token de depth 4+)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import { normalizeForMatch } from "@/lib/taxonomy/normalize";
import {
  getTownSearchPattern,
  makeCategoryFilter,
  makeCategoryTownFilter,
  matchFirstCategory,
  matchSecondCategory,
  matchSecondTown,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";

/* ==================== Tipos ==================== */

/**
 * Parámetros unificados para colectar el universo de una vista
 */
export type ViewParams = {
  /** Nivel de drill-down (0=categorías, 1=towns/categories, 2=subcats, 3=leaves) */
  level: 0 | 1 | 2 | 3;

  /** ID de categoría (requerido para level >= 1 en category-first) */
  categoryId?: CategoryId;

  /** ID de pueblo (requerido para level >= 1 en town-first, level >= 2 en category-first) */
  townId?: TownId;

  /** Si true, solo incluir claves que NO mapearon en nivel anterior (navegar "Otros") */
  othersOnly?: boolean;

  /** Granularidad temporal */
  granularity: WindowGranularity;

  /** Rango temporal actual */
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };

  /** Tipo de navegación (determina orden de segmentos) */
  navigationType?: "category-first" | "town-first";
};

/**
 * Registro individual de time-series con metadata de clave
 */
export type UniverseRecord = {
  key: string; // Clave completa (ej: "root.patrimonio.paterna.tejada")
  keyInfo: KeyInfo; // Metadata parseada (parts, normParts, depth)
  time: string; // YYYYMMDD
  value: number;
};

/**
 * Metadatos sobre el universo colectado
 */
export type UniverseMeta = {
  totalKeys: number; // Cantidad de claves únicas
  totalRecords: number; // Cantidad total de registros (key+time pairs)
  depthDistribution: Record<number, number>; // Cuántas claves por profundidad
  othersCount: number; // Cuántas claves cayeron en "Otros"
};

/* ==================== Debug Flag ==================== */

const DEBUG_UNIVERSE = false; // Cambiar a true para logging detallado

/* ==================== Función Principal ==================== */

/**
 * Colecta el universo de claves que pertenecen a una vista específica
 *
 * Esta es la ÚNICA función que debe usarse para filtrar claves.
 * Tanto donut como series deben llamar a esta función con los mismos params.
 *
 * @param output - Output de Mindsaic (mapa de claves a series)
 * @param params - Parámetros de la vista (level, IDs, othersOnly, etc)
 * @returns Array de registros filtrados
 */
export function collectUniverseForView(
  output: Record<string, Array<{ time: string; value: number }>>,
  params: ViewParams
): UniverseRecord[] {
  const {
    level,
    categoryId,
    townId,
    othersOnly = false,
    navigationType = "category-first",
  } = params;

  if (DEBUG_UNIVERSE) {
    console.log(
      `[collectUniverseForView] level=${level} categoryId=${categoryId} townId=${townId} othersOnly=${othersOnly} type=${navigationType}`
    );
  }

  // Parsear todas las claves una sola vez
  const allKeys = Object.keys(output);
  const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];

  let filteredKeys: KeyInfo[] = [];

  // Aplicar filtro según nivel y tipo de navegación
  switch (level) {
    case 0:
      // Nivel 0: root.<cat> (depth=2)
      filteredKeys = parsedKeys.filter((ki) => ki.depth === 2);
      break;

    case 1:
      // Nivel 1: root.<cat>.<town> o root.<town>.<cat> (depth=3)
      if (navigationType === "category-first") {
        if (!categoryId) {
          throw new Error("categoryId is required for level 1 category-first");
        }
        const categoryFilter = makeCategoryFilter(categoryId, 3);
        filteredKeys = parsedKeys.filter(categoryFilter);
      } else {
        // town-first
        if (!townId) {
          throw new Error("townId is required for level 1 town-first");
        }
        const { token: townToken, wildcard } = getTownSearchPattern(townId);
        filteredKeys = parsedKeys.filter((ki) => {
          if (ki.depth !== 3) return false;
          const townPart = ki.parts[1];
          if (!townPart) return false;
          return wildcard
            ? ki.normParts[1].startsWith(normalizeForMatch(townToken))
            : ki.parts[1].toLowerCase() === townToken.toLowerCase();
        });
      }
      break;

    case 2:
      // Nivel 2: root.<cat>.<town>.<subcat> (depth=4)
      if (navigationType === "category-first") {
        if (!categoryId || !townId) {
          throw new Error(
            "categoryId and townId are required for level 2 category-first"
          );
        }
        const categoryTownFilter = makeCategoryTownFilter(
          categoryId,
          townId,
          4
        );
        filteredKeys = parsedKeys.filter(categoryTownFilter);
      } else {
        // town-first: root.<town>.<cat>.<subcat> (depth=4)
        if (!townId || !categoryId) {
          throw new Error(
            "townId and categoryId are required for level 2 town-first"
          );
        }
        const { token: townToken, wildcard } = getTownSearchPattern(townId);
        filteredKeys = parsedKeys.filter((ki) => {
          if (ki.depth !== 4) return false;
          const townPart = ki.parts[1];
          if (!townPart) return false;

          // Verificar town match
          const townMatches = wildcard
            ? ki.normParts[1].startsWith(normalizeForMatch(townToken))
            : ki.parts[1].toLowerCase() === townToken.toLowerCase();

          if (!townMatches) return false;

          // Verificar category match (en parts[2] para town-first)
          const catId = matchSecondCategory(ki);
          return catId === categoryId;
        });
      }
      break;

    case 3:
      // Nivel 3: Similar a nivel 2 pero puede tener depth > 4
      // TODO: Implementar según taxonomía específica
      throw new Error("Level 3 not implemented yet");

    default:
      throw new Error(`Invalid level: ${level}`);
  }

  // Si othersOnly=true, filtrar solo claves que NO mapearon
  if (othersOnly && level === 1) {
    if (navigationType === "category-first") {
      // Filtrar claves donde matchSecondTown() devuelve null
      filteredKeys = filteredKeys.filter((ki) => matchSecondTown(ki) === null);
    } else {
      // town-first: filtrar claves donde matchFirstCategory() devuelve null
      filteredKeys = filteredKeys.filter(
        (ki) => matchFirstCategory(ki) === null
      );
    }

    if (DEBUG_UNIVERSE) {
      console.log(
        `[collectUniverseForView] othersOnly=true → filtered to ${filteredKeys.length} unmapped keys`
      );
    }
  }

  // Convertir a registros planos (key+time+value)
  const records: UniverseRecord[] = [];
  for (const keyInfo of filteredKeys) {
    const series = output[keyInfo.raw] || [];
    for (const point of series) {
      records.push({
        key: keyInfo.raw,
        keyInfo,
        time: point.time,
        value: point.value,
      });
    }
  }

  if (DEBUG_UNIVERSE) {
    console.log(
      `[collectUniverseForView] Result: ${filteredKeys.length} keys, ${records.length} total records`
    );
    console.log(
      `[collectUniverseForView] Keys:`,
      filteredKeys.map((k) => k.raw)
    );
  }

  return records;
}

/**
 * Calcula metadatos sobre el universo colectado
 */
export function getUniverseMeta(records: UniverseRecord[]): UniverseMeta {
  const uniqueKeys = new Set(records.map((r) => r.key));
  const depthDistribution: Record<number, number> = {};

  for (const record of records) {
    const depth = record.keyInfo.depth;
    depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;
  }

  return {
    totalKeys: uniqueKeys.size,
    totalRecords: records.length,
    depthDistribution,
    othersCount: 0, // Se calcula en el caller si es necesario
  };
}

/**
 * Agrupa registros por clave para análisis
 */
export function groupByKey(
  records: UniverseRecord[]
): Map<string, UniverseRecord[]> {
  const grouped = new Map<string, UniverseRecord[]>();

  for (const record of records) {
    const existing = grouped.get(record.key) || [];
    existing.push(record);
    grouped.set(record.key, existing);
  }

  return grouped;
}
