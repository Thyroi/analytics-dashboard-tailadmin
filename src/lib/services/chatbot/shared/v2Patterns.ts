import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_META } from "@/lib/taxonomy/towns";

const CATEGORY_TOKEN_OVERRIDES: Partial<Record<CategoryId, string>> = {
  otros: "otros",
};

const TOWN_TOKEN_OVERRIDES: Partial<Record<TownId, string>> = {
  laPalmaDelCondado: "palma",
  lucenaDelPuerto: "lucena",
  paternaDelCampo: "paterna",
  rocianaDelCondado: "rociana",
  palos: "palos",
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
    if (candidate === normalized) return townId;
  }

  return null;
}

export function matchCategoryIdFromToken(token: string): CategoryId | null {
  const normalized = normalizeMindsaicV2Token(token);
  const entries = Object.entries(CATEGORY_META) as Array<
    [CategoryId, { label: string }]
  >;

  for (const [categoryId] of entries) {
    const candidate = getCategoryToken(categoryId);
    if (candidate === normalized) return categoryId;
  }

  return null;
}
