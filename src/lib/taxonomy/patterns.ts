import type { CategoryId } from "./categories";
import { matchCategoryId, matchTownId, normalizeForMatch } from "./normalize";
import { TOWN_META, type TownId } from "./towns";

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toToken(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

/* ==================== Key Parsing & Depth Utilities ==================== */

export type KeyInfo = {
  raw: string;
  parts: string[]; // tokens exactos (sin normalizar) para preservar comparaciones
  normParts: string[]; // tokens normalizados (normalizeForMatch por token)
  depth: number; // parts.length
};

/**
 * Divide la clave "root.x.y.z" en partes y normaliza cada token para matching.
 */
export function parseKey(rawKey: string): KeyInfo | null {
  if (!rawKey?.startsWith("root")) return null;
  const parts = rawKey.split(".");
  const normParts = parts.map((p) => normalizeForMatch(p));
  return { raw: rawKey, parts, normParts, depth: parts.length };
}

/**
 * Devuelve si la clave pertenece EXACTAMENTE a un nivel de profundidad N
 */
export function isDepth(keyInfo: KeyInfo, depth: number): boolean {
  return keyInfo.depth === depth;
}

/**
 * Matchea el primer token después de "root" contra una categoryId (tolerante)
 * Para claves tipo: root.categoria.pueblo.subcategoria
 */
export function matchFirstCategory(keyInfo: KeyInfo): CategoryId | null {
  // parts: [root, <cat>, ...]
  if (keyInfo.depth < 2) return null;
  return matchCategoryId(keyInfo.parts[1]); // matchCategoryId ya es tolerante
}

/**
 * Matchea el segundo token (índice 2) contra una categoryId (tolerante)
 * Para claves tipo: root.pueblo.categoria.subcategoria (TOWN-FIRST)
 */
export function matchSecondCategory(keyInfo: KeyInfo): CategoryId | null {
  // parts: [root, <town>, <cat>, ...]
  if (keyInfo.depth < 3) return null;
  return matchCategoryId(keyInfo.parts[2]); // matchCategoryId ya es tolerante
}

/**
 * Matchea el segundo token después de "root" contra un townId (tolerante)
 */
export function matchSecondTown(keyInfo: KeyInfo): TownId | null {
  if (keyInfo.depth < 3) return null;
  return matchTownId(keyInfo.parts[2]); // tolerante
}

/* ==================== Pattern Filters ==================== */

/**
 * Construye un predicado para filtrar keys por patrón raíz:
 * - Si wildcard = true → acepta `root.${token}*` en el SEGUNDO token (categoría)
 * - Si wildcard = false → exige match exacto de token (con matcher tolerante)
 * Además permite fijar profundidad exacta cuando se pide (2, 3, 4).
 */
export function makeCategoryFilter(categoryId: CategoryId, depth?: 2 | 3 | 4) {
  const { token, wildcard } = getCategorySearchPattern(categoryId);
  const tokenNorm = normalizeForMatch(token);

  return (ki: KeyInfo): boolean => {
    if (!ki) return false;
    if (ki.normParts[0] !== "root") return false;
    // Chequeo de categoría (parts[1])
    const catFromKey = matchCategoryId(ki.parts[1]);
    const categoryOk = wildcard
      ? normalizeForMatch(ki.parts[1]).startsWith(tokenNorm)
      : catFromKey === categoryId;

    if (!categoryOk) return false;
    if (depth) return isDepth(ki, depth);
    return true;
  };
}

/**
 * Filtro compuesto categoría+pueblo a profundidad exacta.
 * Caso típico Nivel 1: depth=3, Nivel 2: depth=4.
 */
export function makeCategoryTownFilter(
  categoryId: CategoryId,
  townId: TownId,
  depth: 3 | 4
) {
  const catFilter = makeCategoryFilter(categoryId, depth);
  const { token: townToken, wildcard: townWildcard } =
    getTownSearchPattern(townId);
  const townNorm = normalizeForMatch(townToken);

  return (ki: KeyInfo): boolean => {
    if (!catFilter(ki)) return false;
    // parts[2] debe ser el pueblo
    if (ki.depth < 3) return false;

    if (townWildcard) {
      return normalizeForMatch(ki.parts[2]).startsWith(townNorm);
    }
    const townFromKey = matchTownId(ki.parts[2]);
    return townFromKey === townId;
  };
}

/* ==================== Town & Category Pattern Getters ==================== */

/**
 * Devuelve el token de búsqueda y si debe usarse wildcard para el pueblo dado.
 * Objetivo: poder consultar etiquetas como "root.la palma*." pero mostrar la etiqueta oficial.
 */
export function getTownSearchPattern(townId: TownId): {
  token: string;
  wildcard: boolean;
} {
  // Overrides seguros para nombres compuestos o con variantes en datos
  switch (townId) {
    case "palos":
      return { token: "palos", wildcard: true }; // "palos de la frontera"
    case "lucenaDelPuerto":
      return { token: "lucena", wildcard: true };
    case "paternaDelCampo":
      // Caso especial: usar token corto sin wildcard
      return { token: "paterna", wildcard: false };
    // Note: paternaDelCampo intentionally NOT wildcarded — data appears to use short token "paterna"
    case "rocianaDelCondado":
      return { token: "rociana", wildcard: true };
    case "laPalmaDelCondado":
      return { token: "la palma", wildcard: true };
    default: {
      const label = TOWN_META[townId].label; // p.ej. "Niebla"
      return { token: toToken(label), wildcard: false };
    }
  }
}

/**
 * Devuelve token y wildcard para categorías (pensando en Nivel 2 futuro).
 * Por ahora sólo definimos algunos prefijos útiles.
 */
export function getCategorySearchPattern(categoryId: CategoryId): {
  token: string;
  wildcard: boolean;
} {
  switch (categoryId) {
    case "espaciosMuseisticos":
      return { token: "espacios", wildcard: true }; // "espacios museísticos"
    case "rutasCulturales":
      return { token: "rutas culturales", wildcard: false };
    case "rutasSenderismo":
      return { token: "rutas senderismo y cicloturistas", wildcard: false };
    case "fiestasTradiciones":
      return { token: "fiestas y tradiciones", wildcard: false };
    case "lugaresColombinos":
      return { token: "lugares colombinos", wildcard: false };
    case "laRabida":
      return { token: "la rabida", wildcard: false };
    case "circuitoMonteblanco":
      return { token: "circuito", wildcard: true }; // "circuito monteblanco"
    case "donana":
      return { token: "doñana", wildcard: false };
    case "playas":
      return { token: "playas", wildcard: false };
    case "patrimonio":
      return { token: "patrimonio", wildcard: false };
    case "sabor":
      return { token: "sabor", wildcard: false };
    default:
      return { token: categoryId, wildcard: false };
  }
}
