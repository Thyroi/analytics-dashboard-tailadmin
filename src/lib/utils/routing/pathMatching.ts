/**
 * Utilidades para matching de paths con taxonomías
 */

import {
  type CategoryId,
  CATEGORY_ID_ORDER,
  CATEGORY_SYNONYMS,
} from "@/lib/taxonomy/categories";
import {
  type TownId,
  TOWN_ID_ORDER,
  TOWN_SYNONYMS,
} from "@/lib/taxonomy/towns";

/**
 * Función genérica para hacer matching de slugs en un path
 */
function matchSlugInPath(path: string, slugs: string[]): boolean {
  const lc = path.toLowerCase();
  return slugs.some(
    (s) =>
      lc.includes(`/${s}/`) ||
      lc.endsWith(`/${s}`) ||
      lc.includes(`-${s}-`) ||
      lc.includes(`_${s}_`)
  );
}

/**
 * Determina qué categoría corresponde a un path dado
 */
export function matchCategoryIdFromPath(path: string): CategoryId | null {
  for (const categoryId of CATEGORY_ID_ORDER) {
    const slugs = CATEGORY_SYNONYMS[categoryId];
    if (matchSlugInPath(path, slugs)) {
      return categoryId;
    }
  }
  return null;
}

/**
 * Determina qué pueblo corresponde a un path dado
 */
export function matchTownIdFromPath(path: string): TownId | null {
  const pathLower = path.toLowerCase();

  for (const townId of TOWN_ID_ORDER) {
    // Verificar sinónimos del pueblo
    const synonyms = TOWN_SYNONYMS[townId] || [];
    const allVariants = [
      townId.toLowerCase(),
      ...synonyms.map((s: string) => s.toLowerCase()),
    ];

    for (const variant of allVariants) {
      if (
        pathLower.includes(`/${variant}/`) ||
        pathLower.endsWith(`/${variant}`) ||
        pathLower.includes(`-${variant}-`) ||
        pathLower.includes(`_${variant}_`)
      ) {
        return townId;
      }
    }
  }
  return null;
}

/**
 * Extrae el pathname de una URL de manera segura
 */
export function safeUrlPathname(raw: string): string {
  try {
    const u = new URL(raw);
    return u.pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}
