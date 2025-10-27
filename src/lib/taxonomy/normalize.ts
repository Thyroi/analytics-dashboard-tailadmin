import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "./categories";
import { CATEGORY_EXTRA_SYNONYMS, mergeSynonyms } from "./overrides";
import { TOWN_META, TOWN_SYNONYMS, type TownId } from "./towns";

// Normalizes a raw token to a canonical normalized string used for lookup
export function normalizeText(input: string): string {
  if (!input) return "";
  // Lowercase
  let s = input.toLowerCase();
  // Unicode normalize NFD and remove diacritics
  s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Replace underscores and dashes with spaces
  s = s.replace(/[ _-]+/g, " ");
  // Collapse multiple spaces
  s = s.replace(/\s+/g, " ");
  // Trim
  s = s.trim();
  return s;
}

/**
 * Quita artículos comunes y normaliza múltiples espacios.
 * Asume que 'norm' ya viene normalizado (lower, sin acentos, espacios simples)
 * Ejemplos: "la rabida" -> "rabida", "palos de la frontera" -> "palos frontera"
 */
export function stripArticles(norm: string): string {
  return norm
    .replace(/\b(el|la|los|las|del|de|da|do|dos|das)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza "token" para matching tolerante (usa normalizeText + stripArticles)
 */
export function normalizeForMatch(input: string): string {
  const n = normalizeText(input);
  return stripArticles(n);
}

let _categoryLookup: Map<string, CategoryId> | null = null;
let _townLookup: Map<string, TownId> | null = null;

export function buildCategoryLookup(): Map<string, CategoryId> {
  if (_categoryLookup) return _categoryLookup;

  // Merge base synonyms with extras
  const merged = mergeSynonyms(CATEGORY_SYNONYMS, CATEGORY_EXTRA_SYNONYMS);

  const map = new Map<string, CategoryId>();

  // First insert explicit synonyms from merged (preserve order so explicit wins)
  for (const categoryId of Object.keys(merged) as CategoryId[]) {
    const syns = merged[categoryId] || [];
    for (const syn of syns) {
      const norm = normalizeText(syn);
      const normMatch = normalizeForMatch(syn);

      // Index both normalized and tolerant versions
      if (!map.has(norm)) map.set(norm, categoryId);
      if (!map.has(normMatch) && normMatch !== norm) {
        map.set(normMatch, categoryId);
      }
    }
  }

  // Also index by official label (normalized)
  for (const categoryId of Object.keys(CATEGORY_META) as CategoryId[]) {
    const label = CATEGORY_META[categoryId].label || categoryId;
    const norm = normalizeText(label);
    const normMatch = normalizeForMatch(label);

    if (!map.has(norm)) map.set(norm, categoryId);
    if (!map.has(normMatch) && normMatch !== norm) {
      map.set(normMatch, categoryId);
    }
  }

  _categoryLookup = map;
  return map;
}

export function buildTownLookup(): Map<string, TownId> {
  if (_townLookup) return _townLookup;

  const map = new Map<string, TownId>();

  // First insert explicit synonyms
  for (const townId of Object.keys(TOWN_SYNONYMS) as TownId[]) {
    const syns = TOWN_SYNONYMS[townId] || [];
    for (const syn of syns) {
      const norm = normalizeText(syn);
      const normMatch = normalizeForMatch(syn);

      if (!map.has(norm)) map.set(norm, townId);
      if (!map.has(normMatch) && normMatch !== norm) {
        map.set(normMatch, townId);
      }
    }
  }

  // Also index by official label (normalized)
  for (const townId of Object.keys(TOWN_META) as TownId[]) {
    const label = TOWN_META[townId].label || townId;
    const norm = normalizeText(label);
    const normMatch = normalizeForMatch(label);

    if (!map.has(norm)) map.set(norm, townId);
    if (!map.has(normMatch) && normMatch !== norm) {
      map.set(normMatch, townId);
    }
  }

  _townLookup = map;
  return map;
}

export function matchCategoryId(raw: string): CategoryId | null {
  if (!raw) return null;
  const lookup = buildCategoryLookup();

  // Try exact normalized match first
  const norm = normalizeText(raw);
  if (lookup.has(norm)) return lookup.get(norm) || null;

  // Fallback to tolerant match (without articles)
  const normMatch = normalizeForMatch(raw);
  if (lookup.has(normMatch)) return lookup.get(normMatch) || null;

  return null;
}

export function matchTownId(raw: string): TownId | null {
  if (!raw) return null;
  const lookup = buildTownLookup();

  // Try exact normalized match first
  const norm = normalizeText(raw);
  if (lookup.has(norm)) return lookup.get(norm) || null;

  // Fallback to tolerant match (without articles)
  const normMatch = normalizeForMatch(raw);
  if (lookup.has(normMatch)) return lookup.get(normMatch) || null;

  return null;
}
