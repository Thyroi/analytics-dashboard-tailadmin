/**
 * Parsers y agregadores específicos para Town → Category breakdown
 */

import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import {
  getTownSearchPattern,
  matchSecondCategory,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";
import type { TownId } from "@/lib/taxonomy/towns";
import { OTHERS_ID } from "../partition";
import type { MindsaicOutput, OthersBreakdownEntry } from "./types";

/**
 * Filtra y parsea el universo de claves que pertenecen a esta vista (town)
 * Devuelve KeyInfo[] con metadata completa para uso uniforme en donut y series
 *
 * Acepta profundidad >= 2 para incluir:
 * - Nivel 2: root.town (consultas generales del pueblo)
 * - Nivel 3+: root.town.category.* (consultas por categoría)
 */
export function collectKeyInfosForView(
  output: MindsaicOutput,
  townId: TownId
): KeyInfo[] {
  const { token: townToken, wildcard } = getTownSearchPattern(townId);
  const allKeys = Object.keys(output);
  const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];

  // Filtrar profundidad >= 2 y town matching en parts[1]
  return parsedKeys.filter((keyInfo) => {
    if (keyInfo.depth < 2) return false; // Mínimo root.town

    // Para depth === 2, parts[1] debe ser el town
    if (keyInfo.depth === 2) {
      const townPart = keyInfo.parts[1];
      if (!townPart) return false;

      // Usar parts[1] (sin normalizar) para preservar espacios
      const match = wildcard
        ? townPart.toLowerCase().startsWith(townToken.toLowerCase())
        : townPart.toLowerCase() === townToken.toLowerCase();

      return match;
    }

    // Para depth >= 3, parts[1] debe ser el town
    const townPart = keyInfo.parts[1];
    if (!townPart) return false;

    const match = wildcard
      ? townPart.toLowerCase().startsWith(townToken.toLowerCase())
      : townPart.toLowerCase() === townToken.toLowerCase();

    return match;
  });
}

/**
 * Parsea respuesta de Mindsaic usando helpers de profundidad
 * Filtra solo claves root.<town>.<categoria> (profundidad 3)
 * Ahora también recopila detalles de "Otros" para drill-down
 * Nota: A diferencia de categoryTownBreakdown, aquí el orden es town→category
 */
export function parseTownCategories(
  output: MindsaicOutput,
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

  // Usar universo filtrado unificado
  const matchedKeys = collectKeyInfosForView(output, townId);

  // NOTA: NO verificar hijos aquí - se hará después con queries separadas
  // Por ahora, aceptar TODAS las categorías depth=3

  // Procesar todas las keys
  for (const keyInfo of matchedKeys) {
    // Para profundidad 2 (root.town), son consultas generales del pueblo
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

    // CRÍTICO: Solo procesar depth=3 (root.town.category)
    // Ignorar depth>=4 (subcategorías) - solo se usan para children verification
    if (keyInfo.depth !== 3) {
      continue;
    }

    // Mapear categoría
    const categoryId = matchSecondCategory(keyInfo);

    const series = output[keyInfo.raw] || [];
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);

    // ACEPTAR TODAS las categorías por ahora (la reclasificación se hará después)
    if (categoryId) {
      const prev = totals.get(categoryId) || 0;
      totals.set(categoryId, prev + total);
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
 * Agrega totales diarios a nivel de town (profundidad 3) → { ISO: total }
 * IMPORTANTE: Ahora usa el mismo universo filtrado que parseTownCategories (collectKeyInfosForView)
 */
export function aggregateDailyTotals(
  output: MindsaicOutput,
  townId: TownId
): Map<string, number> {
  const totals = new Map<string, number>();

  // Usar mismo universo que donut/totals
  const matchedKeys = collectKeyInfosForView(output, townId);

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
