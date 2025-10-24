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
    | "lugaresColombinos"
    | "otros";

  export type CategoryMeta = {
    id: CategoryId;
    label: string; // etiqueta UI exacta
    iconSrc: string; // ruta pública al icono (carpeta /public/tags)
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
    "otros",
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
    otros: {
      id: "otros",
      label: "OTROS",
      iconSrc: "/tags/patrimonio.png", // icono genérico
    },
  };

  export const CATEGORIES: ReadonlyArray<CategoryMeta> = CATEGORY_ID_ORDER.map(
    (id) => CATEGORY_META[id]
  );

  export function getCategoryLabel(id: CategoryId): string {
    return CATEGORY_META[id].label;
  }

  export function getCategoryIconSrc(id: CategoryId): string {
    return CATEGORY_META[id].iconSrc;
  }

  /**
   * Sinónimos y variantes frecuentes que deben mapear a cada categoría.
   * Nota: aquí solo categorías raíz (no añadimos subtemas como “fauna”, “otros”, etc.)
   */
  export const CATEGORY_SYNONYMS: Record<CategoryId, string[]> = {
    naturaleza: ["naturaleza", "nature", "fauna"],
    fiestasTradiciones: [
      "fiestas-y-tradiciones",
      "fiestas_tradiciones",
      "fiestas_y_tradiciones",
      "fiestas-tradiciones",
      "fiestas",
      "fiestas y tradiciones",
      "festivals-and-traditions",
      "festivals_traditions",
    ],
    playas: ["playas", "playa", "beaches", "beach"],
    espaciosMuseisticos: [
      "espacios-museisticos",
      "espacios_museisticos",
      // variantes con acentos/errores comunes que vimos en datos
      "espacios-museísticos",
      "espacios_museísticos",
      "espacios-museíticos",
      "espacios_museíticos",
      // ERROR TIPOGRÁFICO común en API: "museiticos" (falta 's')
      "espacios-museiticos",
      "espacios_museiticos",
      // Variantes exactas sin tildes que aparecen en los datos
      "espacios_museiticos",
      "espacios-museiticos",
      "museos",
      "museums",
      "museum-spaces",
      "museum_spaces",
    ],
    patrimonio: [
      "patrimonio",
      "heritage",
      "iglesias", // aparece en datos pero es subtema -> lo dejamos por robustez
    ],
    rutasCulturales: [
      "rutas-culturales",
      "rutas_culturales",
      "cultural-routes",
      "cultural_routes",
      // en datos aparece “rutas” a secas; preferimos mapearlo aquí (no a senderismo)
      "rutas",
      "rutas culturales",
    ],
    rutasSenderismo: [
      "rutas-senderismo",
      "rutas_senderismo",
      "rutas-senderismo-y-cicloturistas",
      "hiking",
      "hiking-and-cycling-routes",
      "hiking_and_cycling_routes",
      "senderismo",
      "btt",
      "vias-verdes",
      "vias_verdes",
      "vías",
      "vias",
    ],
    sabor: ["sabor", "taste", "gastronomia", "gastronomía", "food"],
    donana: ["donana", "doñana", "donana", "doñana"],
    circuitoMonteblanco: [
      "circuito-monteblanco",
      "circuito_monteblanco",
      "monteblanco",
    ],
    laRabida: ["la-rabida", "la_rabida", "rabida", "larabida"],
    lugaresColombinos: [
      "lugares-colombinos",
      "lugares_colombinos",
      "colombinos",
      "lugares colombinos",
    ],
    otros: ["otros", "other", "others", "varios", "miscelanea", "miscelánea"],
  };
