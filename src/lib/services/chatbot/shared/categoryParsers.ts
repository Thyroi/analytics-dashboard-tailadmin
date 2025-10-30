/**
 * Parsers y agregadores específicos para Category → Town breakdown
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  getCategorySearchPattern,
  matchSecondTown,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import { OTHERS_ID } from "../partition";
import type { MindsaicOutput, OthersBreakdownEntry } from "./types";

/**
 * Filtra y parsea el universo de claves que pertenecen a esta vista (category)
 * Devuelve KeyInfo[] con metadata completa para uso uniforme en donut y series
 *
 * Acepta profundidad >= 2 para incluir:
 * - Nivel 2: root.category (consultas generales de la categoría)
 * - Nivel 3+: root.category.town.* (consultas por pueblo)
 */
export function collectKeyInfosForView(
  output: MindsaicOutput,
  categoryId: CategoryId
): KeyInfo[] {
  const { token: categoryToken, wildcard } =
    getCategorySearchPattern(categoryId);
  const allKeys = Object.keys(output);
  const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];

  // Filtrar profundidad >= 2 y category matching en parts[1]
  return parsedKeys.filter((keyInfo) => {
    if (keyInfo.depth < 2) return false; // Mínimo root.category

    // Para depth === 2, parts[1] debe ser la categoría
    if (keyInfo.depth === 2) {
      const categoryPart = keyInfo.parts[1];
      if (!categoryPart) return false;

      const match = wildcard
        ? categoryPart.toLowerCase().startsWith(categoryToken.toLowerCase())
        : categoryPart.toLowerCase() === categoryToken.toLowerCase();

      return match;
    }

    // Para depth >= 3, parts[1] debe ser la categoría
    const categoryPart = keyInfo.parts[1];
    if (!categoryPart) return false;

    const match = wildcard
      ? categoryPart.toLowerCase().startsWith(categoryToken.toLowerCase())
      : categoryPart.toLowerCase() === categoryToken.toLowerCase();

    return match;
  });
}

/**
 * Parsea respuesta de Mindsaic usando helpers de profundidad
 * Filtra solo claves root.<categoria>.<pueblo> (profundidad 3)
 * También recopila detalles de "Otros" para drill-down
 */
export function parseCategoryTowns(
  output: MindsaicOutput,
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

  // Usar universo filtrado unificado
  const matchedKeys = collectKeyInfosForView(output, categoryId);

  // Procesar todas las keys
  for (const keyInfo of matchedKeys) {
    // Para profundidad 2 (root.category), son consultas generales de la categoría
    if (keyInfo.depth === 2) {
      const series = output[keyInfo.raw] || [];
      const total = series.reduce((sum, point) => sum + (point.value || 0), 0);

      const prev = totals.get(OTHERS_ID) || 0;
      totals.set(OTHERS_ID, prev + total);

      othersBreakdown.push({
        key: keyInfo.raw,
        path: keyInfo.parts,
        value: total,
        timePoints: series.map((pt) => ({ time: pt.time, value: pt.value })),
      });

      continue;
    }

    // CRÍTICO: Solo procesar depth=3 (root.category.town)
    // Ignorar depth>=4 (subcategorías) - solo se usan para children verification
    if (keyInfo.depth !== 3) {
      continue;
    }

    // Mapear pueblo
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
 * Agrega totales diarios a nivel de categoría (profundidad 3) → { ISO: total }
 * IMPORTANTE: Usa el mismo universo filtrado que parseCategoryTowns (collectKeyInfosForView)
 */
export function aggregateDailyTotals(
  output: MindsaicOutput,
  categoryId: CategoryId
): Map<string, number> {
  const totals = new Map<string, number>();

  // Usar mismo universo que donut/totals
  const matchedKeys = collectKeyInfosForView(output, categoryId);

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
