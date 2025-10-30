/**
 * Utilidades para mapeo de tokens a categorías
 * Consolidación de lógica duplicada en:
 * - src/lib/utils/data/aggregateCategories.ts
 * - src/features/chatbot/utils/aggregation.ts
 */

import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { toTokens } from "../string/tokenization";

/**
 * Construye un diccionario token -> CategoryId a partir de los metadatos de categorías.
 * Incluye: ID, label UI y sinónimos.
 *
 * @returns Map con todos los tokens posibles mapeados a su CategoryId correspondiente
 *
 * @example
 * const map = buildCategoryTokenMap();
 * map.get("playas"); // "playas-costa"
 * map.get("playa"); // "playas-costa"
 */
export function buildCategoryTokenMap(): Map<string, CategoryId> {
  const map = new Map<string, CategoryId>();

  (Object.keys(CATEGORY_META) as CategoryId[]).forEach((cid) => {
    const meta = CATEGORY_META[cid];
    const syns = CATEGORY_SYNONYMS[cid] ?? [];

    // Generar tokens desde múltiples fuentes
    const baseTokens = [
      ...toTokens(cid), // ID de la categoría
      ...toTokens(meta.label), // Label UI
      ...syns.flatMap(toTokens), // Sinónimos
    ];

    // Registrar cada token en el mapa
    for (const token of baseTokens) {
      map.set(token, cid);
    }
  });

  return map;
}

/**
 * Función de debug para inspeccionar el tokenMap completo
 * Útil para desarrollo y debugging
 */
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
