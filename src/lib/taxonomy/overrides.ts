import type { CategoryId } from "./categories";

// Extra synonyms observed in raw data that we want to ensure map to canonical CategoryId
export const CATEGORY_EXTRA_SYNONYMS: Record<CategoryId, string[]> = {
  naturaleza: ["naturaleza", "nature", "fauna", "aves"],
  fiestasTradiciones: [
    "fiestas y tradiciones",
    "fiestas_y_tradiciones",
    "fiestas-y-tradiciones",
    "fiestas",
    "fiestas y tradiciones.populares",
    "fiestas_y_tradiciones.romería_virgen_del_socorro",
    "fiestas.cruces_de_mayo",
  ],
  playas: ["playas", "playa", "playas.accesos", "playas.banderas"],
  espaciosMuseisticos: [
    "espacios museísticos",
    "espacios_museísticos",
    "espacios museisticos",
    "espacios_museisticos",
    "espacios museiticos",
    "espacios_museiticos",
    "espacios_museíticos",
    "espacios-museísticos",
    "espacios", // Token corto para wildcard
    "museos",
    "espacios_museisticos.niebla",
    "espacios_museisticos.la_palma",
  ],
  patrimonio: [
    "patrimonio",
    "iglesias",
    "muralla",
    "murallas",
    "monumentos",
    "historia",
  ],
  rutasCulturales: [
    "rutas culturales",
    "rutas_culturales",
    "rutas-culturales",
    "rutas culturales.historia",
    "rutas culturales.monumentos",
  ],
  rutasSenderismo: [
    "rutas senderismo y cicloturistas",
    "rutas_senderismo_y_cicloturistas",
    "rutas senderismo",
    "senderismo",
    "rutas",
    "vias-verdes",
    "vías",
    "via_verde",
  ],
  sabor: ["sabor", "SABOR", "gastronomia", "gastronomía", "platos", "vinos"],
  donana: ["doñana", "donana"],
  circuitoMonteblanco: ["circuito monteblanco", "monteblanco"],
  laRabida: ["la rabida", "rabida", "la rábida", "la_rabida"],
  lugaresColombinos: ["lugares colombinos", "colombinos"],
  otros: ["otros", "miscelanea", "miscelánea", "general"],
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
