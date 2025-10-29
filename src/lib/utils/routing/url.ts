import { toTokens as toTokensUtil } from "@/lib/utils/string/tokenization";

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @deprecated Use toTokens from '@/lib/utils/string/tokenization' instead
 */
export function toTokens(baseLabelOrId: string): string[] {
  return toTokensUtil(baseLabelOrId);
}

export function safePathname(raw: string): string {
  try {
    return new URL(raw).pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

// 👇 Añadir en lib/utils/url.ts
import { CATEGORY_ID_ORDER, CATEGORY_SYNONYMS, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";

export function normalizePath(path: string): string {
  const p = (path || "/").trim();
  let s = p.startsWith("/") ? p : `/${p}`;
  s = s.replace(/\/{2,}/g, "/");
  // mantén slash final excepto si es raíz
  if (s !== "/" && !s.endsWith("/")) s = `${s}/`;
  return s;
}

export function stripLangPrefix(path: string): { path: string; lang: "es" | "en" } {
  const n = normalizePath(path);
  if (n.startsWith("/en/") || n === "/en/") {
    return { path: normalizePath(n.replace(/^\/en\/?/, "/")), lang: "en" };
  }
  return { path: n, lang: "es" };
}

export function canonicalizeCategorySlug(raw: string): CategoryId | null {
  const slug = raw.toLowerCase();
  for (const catId of CATEGORY_ID_ORDER) {
    const variants = CATEGORY_SYNONYMS[catId] || [];
    if (variants.some(v => v.toLowerCase() === slug)) return catId;
  }
  return null;
}

export function parsePath(input: string): {
  townId?: TownId;
  categoryId?: CategoryId;
  subSlug?: string;
  lang?: "es" | "en";
} {
  const { path, lang } = stripLangPrefix(input);
  // /town/             -> ["","town",""]
  // /town/category/    -> ["","town","category",""]
  // /town/category/x/  -> ["","town","category","x",""]
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { lang };
  const maybeTown = parts[0].toLowerCase();
  const townId = (TOWN_ID_ORDER as readonly string[]).find(t => t.toLowerCase() === maybeTown) as TownId | undefined;

  if (!townId) return { lang };

  // segundo segmento: categoría (sinónimos)
  const maybeCatRaw = parts[1]?.toLowerCase();
  let categoryId: CategoryId | undefined;
  if (maybeCatRaw) {
    // prueba como está y con separadores normalizados
    const cat =
      canonicalizeCategorySlug(maybeCatRaw) ??
      canonicalizeCategorySlug(maybeCatRaw.replace(/_/g, "-"));
    if (cat) categoryId = cat;
  }

  const subSlug = categoryId && parts[2] ? parts[2].toLowerCase() : undefined;

  return { townId, categoryId, subSlug, lang };
}
