import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";

export type SectorMode = "tag" | "town";

export function baseOrder(mode: SectorMode): readonly string[] {
  return mode === "tag" ? CATEGORY_ID_ORDER : TOWN_ID_ORDER;
}

/** Mantiene el orden de taxonomía y filtra por ids disponibles */
export function orderIdsByTaxonomy(mode: SectorMode, ids: string[]): string[] {
  const set = new Set(ids);
  return baseOrder(mode).filter((id) => set.has(id));
}

export function sectorTitle(mode: SectorMode, id: string): string {
  return mode === "tag"
    ? CATEGORY_META[id as CategoryId]?.label ?? id
    : TOWN_META[id as TownId]?.label ?? id;
}

export function sectorIconSrc(
  mode: SectorMode,
  id: string
): string | undefined {
  const src =
    mode === "tag"
      ? CATEGORY_META[id as CategoryId]?.iconSrc
      : TOWN_META[id as TownId]?.iconSrc;
  return src && src.length > 0 ? src : undefined;
}

/** Útiles para drilldowns por label → id */
export function labelToTownId(label: string): TownId | undefined {
  const entry = Object.entries(TOWN_META).find(([, m]) => m.label === label);
  return entry?.[0] as TownId | undefined;
}
export function labelToCategoryId(label: string): CategoryId | undefined {
  const entry = Object.entries(CATEGORY_META).find(
    ([, m]) => m.label === label
  );
  return entry?.[0] as CategoryId | undefined;
}
