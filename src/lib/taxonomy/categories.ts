/**
 * Catálogo canónico de categorías (tags raíz) para toda la app.
 * - IDs estables en camelCase.
 * - Labels UI EXACTOS (mayúsculas + acentos) para mostrar.
 * - iconSrc apunta a /public/tags/*.png (Next sirve esto desde la raíz).
 */

export type CategoryId =
  | "naturaleza"
  | "fiestasTradiciones"
  | "playas"
  | "espaciosMuseisticos"
  | "patrimonio"
  | "rutasCulturales"
  | "rutasSenderismo"
  | "sabor"
  | "donana"
  | "circuitoMonteblanco"
  | "laRabida"
  | "lugaresColombinos";

export type CategoryMeta = {
  id: CategoryId;
  label: string;     // etiqueta UI exacta
  iconSrc: string;   // ruta pública al icono (carpeta /public/tags)
};

export const CATEGORY_ID_ORDER: readonly CategoryId[] = [
  "naturaleza",
  "fiestasTradiciones",
  "playas",
  "espaciosMuseisticos",
  "patrimonio",
  "rutasCulturales",
  "rutasSenderismo",
  "sabor",
  "donana",
  "circuitoMonteblanco",
  "laRabida",
  "lugaresColombinos",
] as const;

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  naturaleza: {
    id: "naturaleza",
    label: "NATURALEZA",
    iconSrc: "/tags/naturaleza.png",
  },
  fiestasTradiciones: {
    id: "fiestasTradiciones",
    label: "FIESTAS Y TRADICIONES",
    iconSrc: "/tags/fiestas.png",
  },
  playas: {
    id: "playas",
    label: "PLAYAS",
    iconSrc: "/tags/playa.png",
  },
  espaciosMuseisticos: {
    id: "espaciosMuseisticos",
    label: "ESPACIOS MUSEÍSTICOS",
    iconSrc: "/tags/museisticos.png",
  },
  patrimonio: {
    id: "patrimonio",
    label: "PATRIMONIO",
    iconSrc: "/tags/patrimonio.png",
  },
  rutasCulturales: {
    id: "rutasCulturales",
    label: "RUTAS CULTURALES",
    iconSrc: "/tags/culturales.png",
  },
  rutasSenderismo: {
    id: "rutasSenderismo",
    label: "RUTAS SENDERISMO Y CICLOTURISTAS",
    iconSrc: "/tags/senderismo.png",
  },
  sabor: {
    id: "sabor",
    label: "SABOR",
    iconSrc: "/tags/sabor.png",
  },
  donana: {
    id: "donana",
    label: "DOÑANA",
    iconSrc: "/tags/donana.png",
  },
  circuitoMonteblanco: {
    id: "circuitoMonteblanco",
    label: "CIRCUITO MONTEBLANCO",
    iconSrc: "/tags/circuito.png",
  },
  laRabida: {
    id: "laRabida",
    label: "LA RÁBIDA",
    iconSrc: "/tags/rabida.png",
  },
  lugaresColombinos: {
    id: "lugaresColombinos",
    label: "LUGARES COLOMBINOS",
    iconSrc: "/tags/colombinos.png",
  },
};

export const CATEGORIES: ReadonlyArray<CategoryMeta> =
  CATEGORY_ID_ORDER.map((id) => CATEGORY_META[id]);

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORY_META[id].label;
}

export function getCategoryIconSrc(id: CategoryId): string {
  return CATEGORY_META[id].iconSrc;
}

// 👇 Añadir al final de lib/taxonomy/categories.ts
export const CATEGORY_SYNONYMS: Record<CategoryId, string[]> = {
  naturaleza: ["naturaleza", "nature"],
  fiestasTradiciones: [
    "fiestas-tradiciones",
    "fiestas-y-tradiciones",
    "festivals-and-traditions",
    "festivals_traditions",
    "fiestas",
  ],
  playas: ["playas", "playa", "beaches", "beach"],
  espaciosMuseisticos: [
    "espacios-museisticos",
    "espacios_museisticos",
    "museos",
    "museums",
    "museum-spaces",
    "museum_spaces",
  ],
  patrimonio: ["patrimonio", "heritage"],
  rutasCulturales: ["rutas-culturales", "cultural-routes", "cultural_routes"],
  rutasSenderismo: [
    "rutas-senderismo",
    "rutas-senderismo-y-cicloturistas",
    "senderismo",
    "hiking",
    "hiking-and-cycling-routes",
    "hiking_and_cycling_routes",
    "btt",
    "vias-verdes",
    "vias_verdes",
  ],
  sabor: ["sabor", "taste", "gastronomia", "food"],
  donana: ["donana", "doñana", "donana-2", "donana_2", "donana2"],
  circuitoMonteblanco: ["circuito-monteblanco", "monteblanco"],
  laRabida: ["la-rabida", "rabida", "la_rabida"],
  lugaresColombinos: ["lugares-colombinos", "colombinos", "lugares_colombinos"],
};
