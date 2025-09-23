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
  | "crucesMayoBonares"
  | "escacena"
  | "hinojos"
  | "laPalmaDelCondado"
  | "lucenaDelPuerto"
  | "manzanilla"
  | "niebla"
  | "palos"
  | "paternaDelCampo"
  | "puertasMurallaNiebla"
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
  "crucesMayoBonares",
  "escacena",
  "hinojos",
  "laPalmaDelCondado",
  "lucenaDelPuerto",
  "manzanilla",
  "niebla",
  "palos",
  "paternaDelCampo",
  "puertasMurallaNiebla",
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
  chucena: "chucena.png",
  crucesMayoBonares: "bonares.png",           // alias (no hay archivo específico)
  escacena: "escacena.png",
  hinojos: "hinojos.png",
  laPalmaDelCondado: "palma.png",            // alias visto en /public
  lucenaDelPuerto: "lucena.png",             // alias visto en /public
  manzanilla: "manzanilla.png",
  niebla: "niebla.png",
  palos: "palos.png",
  paternaDelCampo: "paterna.png",
  puertasMurallaNiebla: "niebla.png",        // alias (no hay archivo específico)
  rocianaDelCondado: "rociana.png",          // alias visto en /public
  villalba: "villalba.png",
  villarrasa: "villarasa.png",               // archivo usa una sola “r”
};

const LABELS: Record<TownId, string> = {
  almonte: "Almonte",
  bollullos: "Bollullos",
  bonares: "Bonares",
  chucena: "Chucena",
  crucesMayoBonares: "Cruces de mayo de Bonares",
  escacena: "Escacena",
  hinojos: "Hinojos",
  laPalmaDelCondado: "La Palma del Condado",
  lucenaDelPuerto: "Lucena del Puerto",
  manzanilla: "Manzanilla",
  niebla: "Niebla",
  palos: "Palos",
  paternaDelCampo: "Paterna del Campo",
  puertasMurallaNiebla: "Puertas de la muralla de Niebla",
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

export const TOWNS: ReadonlyArray<TownMeta> =
  TOWN_ID_ORDER.map((id) => TOWN_META[id]);

export function getTownLabel(id: TownId): string {
  return TOWN_META[id].label;
}

export function getTownIconSrc(id: TownId): string {
  return TOWN_META[id].iconSrc;
}
