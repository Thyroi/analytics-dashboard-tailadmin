import type { CategoryId } from "./categories";

// Extra synonyms observed in raw data that we want to ensure map to canonical CategoryId
export const CATEGORY_EXTRA_SYNONYMS: Record<CategoryId, string[]> = {
  naturaleza: [],
  fiestasTradiciones: ["fiestas y tradiciones"],
  playas: [],
  espaciosMuseisticos: ["espacios museísticos"],
  patrimonio: [],
  rutasCulturales: [],
  rutasSenderismo: ["rutas senderismo y cicloturistas"],
  sabor: ["SABOR"],
  donana: [],
  circuitoMonteblanco: [],
  laRabida: [],
  lugaresColombinos: [],
  otros: [],
};

export function mergeSynonyms(
  base: Record<CategoryId, string[]>,
  extra: Record<CategoryId, string[]>
): Record<CategoryId, string[]> {
  const out: Record<CategoryId, string[]> = { ...base };
  for (const k of Object.keys(extra) as CategoryId[]) {
    const arr = out[k] ?? [];
    const merged = Array.from(new Set([...arr, ...(extra[k] || [])]));
    out[k] = merged;
  }
  return out;
}
