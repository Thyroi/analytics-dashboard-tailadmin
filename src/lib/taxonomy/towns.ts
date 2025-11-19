/**
 * Catálogo de pueblos con label e icono.
 * - IDs estables (camelCase donde aplica, igual que tu mock).
 * - iconSrc apunta a /public/escudos_pueblos/*.png
 *   Nota: algunos IDs usan alias de archivo (p.ej. laPalmaDelCondado -> palma.png).
 */

export type TownId =
  | "almonte"
  | "bollullos"
  | "bonares"
  | "chucena"
  | "escacena"
  | "hinojos"
  | "laPalmaDelCondado"
  | "lucenaDelPuerto"
  | "manzanilla"
  | "niebla"
  | "palos"
  | "paternaDelCampo"
  | "rocianaDelCondado"
  | "villalba"
  | "villarrasa";

export type TownMeta = {
  id: TownId;
  label: string;
  iconSrc: string; // ruta pública
};

/** Orden canónico */
export const TOWN_ID_ORDER: readonly TownId[] = [
  "almonte",
  "bollullos",
  "bonares",
  "chucena",
  "escacena",
  "hinojos",
  "laPalmaDelCondado",
  "lucenaDelPuerto",
  "manzanilla",
  "niebla",
  "palos",
  "paternaDelCampo",
  "rocianaDelCondado",
  "villalba",
  "villarrasa",
] as const;

/**
 * Mapa id -> nombre de archivo dentro de /public/escudos_pueblos
 * (cuando coincide, lo dejamos igual; cuando no existe, usamos el alias más cercano)
 */
const FILE_ALIAS: Record<TownId, string> = {
  almonte: "almonte.png",
  bollullos: "bollullos.png",
  bonares: "bonares.png",
  chucena: "chucena.png", // alias (no hay archivo específico)
  escacena: "escacena.png",
  hinojos: "hinojos.png",
  laPalmaDelCondado: "palma.png", // alias visto en /public
  lucenaDelPuerto: "lucena.png", // alias visto en /public
  manzanilla: "manzanilla.png",
  niebla: "niebla.png",
  palos: "palos.png",
  paternaDelCampo: "paterna.png",
  rocianaDelCondado: "rociana.png", // alias visto en /public
  villalba: "villalba.png",
  villarrasa: "villarasa.png", // archivo usa una sola “r”
};

const LABELS: Record<TownId, string> = {
  almonte: "Almonte",
  bollullos: "Bollullos",
  bonares: "Bonares",
  chucena: "Chucena",
  escacena: "Escacena",
  hinojos: "Hinojos",
  laPalmaDelCondado: "La Palma del Condado",
  lucenaDelPuerto: "Lucena del Puerto",
  manzanilla: "Manzanilla",
  niebla: "Niebla",
  palos: "Palos",
  paternaDelCampo: "Paterna del Campo",
  rocianaDelCondado: "Rociana del Condado",
  villalba: "Villalba",
  villarrasa: "Villarrasa",
};

export const TOWN_META: Record<TownId, TownMeta> = Object.fromEntries(
  TOWN_ID_ORDER.map((id) => [
    id,
    {
      id,
      label: LABELS[id],
      iconSrc: `/escudos_pueblos/${FILE_ALIAS[id]}`,
    },
  ])
) as Record<TownId, TownMeta>;

export const TOWNS: ReadonlyArray<TownMeta> = TOWN_ID_ORDER.map(
  (id) => TOWN_META[id]
);

/**
 * Sinónimos y variantes de towns que aparecen en el API del chatbot.
 * Basado en análisis real de datos del chatbot API con parámetros:
 * {db: "project_huelva", patterns: "root.*.*.*", granularity: "d", startTime: "20231018", endTime: "20251018"}
 */
export const TOWN_SYNONYMS: Record<TownId, string[]> = {
  almonte: ["almonte", "Almonte"],
  bollullos: ["bollullos", "BOLLULLOS", "bollullos-par-del-condado"],
  bonares: ["bonares", "Bonares"],
  chucena: ["chucena"],
  escacena: ["escacena"],
  hinojos: ["hinojos"],
  laPalmaDelCondado: [
    "la palma del condado",
    "la palma",
    "la_palma",
    "la-palma-del-condado",
    "la-palma",
    "palma del condado",
  ],
  lucenaDelPuerto: [
    "lucena del puerto",
    "lucena_del_puerto",
    "lucena",
    "lucena-del-puerto",
  ],
  manzanilla: ["manzanilla"],
  niebla: ["niebla", "NIEBLA"],
  palos: ["palos", "palos de la frontera"],
  paternaDelCampo: ["paterna del campo", "paterna", "paterna-del-campo"],
  rocianaDelCondado: [
    "rociana del condado",
    "rociana",
    "rocianna", // typo en API
    "rociana-del-condado",
  ],
  villalba: ["villalba del alcor", "villalba", "villalba-del-alcor"],
  villarrasa: ["villarrasa"],
};

export function getTownLabel(id: TownId): string {
  return TOWN_META[id].label;
}

export function getTownIconSrc(id: TownId): string {
  return TOWN_META[id].iconSrc;
}

/**
 * Mapeo DIRECTO de TownId → Token RAW para queries del chatbot.
 * Este es el token EXACTO que aparece en las keys de Mindsaic (e.g., "la palma del condado").
 * Usado para construir patterns sin necesidad de llamar getTownSearchPattern.
 *
 * Preservar caracteres especiales como ñ, tildes, etc. tal como aparecen en los datos.
 */
export const CHATBOT_TOWN_TOKENS: Record<TownId, string> = {
  almonte: "almonte",
  bollullos: "bollullos",
  bonares: "bonares",
  chucena: "chucena",
  escacena: "escacena",
  hinojos: "hinojos",
  laPalmaDelCondado: "la palma del condado",
  lucenaDelPuerto: "lucena del puerto",
  manzanilla: "manzanilla",
  niebla: "niebla",
  palos: "palos de la frontera",
  paternaDelCampo: "paterna del campo",
  rocianaDelCondado: "rociana del condado",
  villalba: "villalba", // SOLO primera palabra, requiere wildcard
  villarrasa: "villarrasa",
};

/**
 * Pueblos que requieren wildcard (*) en sus patterns debido a variaciones en los datos.
 * Estos pueblos usan solo parte del token en CHATBOT_TOWN_TOKENS.
 */
export const CHATBOT_TOWN_NEEDS_WILDCARD: Set<TownId> = new Set([
  "villalba", // "villalba*" - variantes: villalba, villalba del alcor, etc.
]);
