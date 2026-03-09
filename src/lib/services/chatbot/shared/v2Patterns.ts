import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
} from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_META } from "@/lib/taxonomy/towns";

const CATEGORY_TOKEN_OVERRIDES: Record<CategoryId, string> = {
  naturaleza: "naturaleza",
  fiestasTradiciones: "tradiciones",
  playas: "playas",
  espaciosMuseisticos: "museos",
  patrimonio: "patrimonio",
  rutasCulturales: "rutas_culturales",
  rutasSenderismo: "senderismo",
  sabor: "gastronomia",
  donana: "donana",
  circuitoMonteblanco: "monteblanco",
  laRabida: "la_rabida",
  lugaresColombinos: "lugares_colombinos",
  otros: "otros",
};

const TOWN_TOKEN_OVERRIDES: Partial<Record<TownId, string>> = {
  laPalmaDelCondado: "la palma",
  lucenaDelPuerto: "lucena",
  paternaDelCampo: "paterna",
  rocianaDelCondado: "rociana",
  palos: "palos",
};

const LEGACY_TOWN_TOKEN_ALIASES: Partial<Record<TownId, string[]>> = {
  laPalmaDelCondado: ["palma"],
};

export function normalizeMindsaicV2Token(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "y")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_");
}

export function getCategoryToken(categoryId: CategoryId): string {
  const override = CATEGORY_TOKEN_OVERRIDES[categoryId];
  if (override) return override;

  const label = CATEGORY_META[categoryId]?.label || categoryId;
  return normalizeMindsaicV2Token(label);
}

type CategoryTownPatternTownId = TownId | "otros";

export function getTownToken(townId: CategoryTownPatternTownId): string {
  if (townId === "otros") return "otros";

  const override = TOWN_TOKEN_OVERRIDES[townId];
  if (override) return override;

  const label = TOWN_META[townId]?.label || townId;
  return normalizeMindsaicV2Token(label);
}

export function buildCategoryPattern(categoryId: CategoryId): string | null {
  if (categoryId === "otros") return null;
  return `*.${getCategoryToken(categoryId)}`;
}

export function buildTownPattern(townId: TownId): string {
  return `${getTownToken(townId)}.*`;
}

export function buildCategoryTownPattern(
  categoryId: CategoryId,
  townId: CategoryTownPatternTownId,
): string {
  const townToken = getTownToken(townId);
  const categoryToken = getCategoryToken(categoryId);
  return `${townToken}.${categoryToken}`;
}

export function matchTownIdFromToken(token: string): TownId | null {
  const normalized = normalizeMindsaicV2Token(token);
  const entries = Object.entries(TOWN_META) as Array<
    [TownId, { label: string }]
  >;

  for (const [townId] of entries) {
    const candidate = getTownToken(townId);
    if (normalizeMindsaicV2Token(candidate) === normalized) return townId;

    const legacyAliases = LEGACY_TOWN_TOKEN_ALIASES[townId] ?? [];
    const matchesLegacy = legacyAliases.some(
      (alias) => normalizeMindsaicV2Token(alias) === normalized,
    );
    if (matchesLegacy) return townId;
  }

  return null;
}

export function matchCategoryIdFromToken(token: string): CategoryId | null {
  if (token === "__others__") return null;

  const normalized = normalizeMindsaicV2Token(token);
  for (const categoryId of CATEGORY_ID_ORDER) {
    const candidates = new Set<string>([
      getCategoryToken(categoryId),
      normalizeMindsaicV2Token(categoryId),
      normalizeMindsaicV2Token(CATEGORY_META[categoryId]?.label || categoryId),
      ...(CATEGORY_SYNONYMS[categoryId] || []).map((syn) =>
        normalizeMindsaicV2Token(syn),
      ),
    ]);

    if (candidates.has(normalized)) return categoryId;
  }

  return null;
}
