import type { CategoryId } from "./categories";
import { TOWN_META, type TownId } from "./towns";

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toToken(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

/**
 * Devuelve el token de búsqueda y si debe usarse wildcard para el pueblo dado.
 * Objetivo: poder consultar etiquetas como "root.la palma*." pero mostrar la etiqueta oficial.
 */
export function getTownSearchPattern(townId: TownId): {
  token: string;
  wildcard: boolean;
} {
  // Overrides seguros para nombres compuestos o con variantes en datos
  switch (townId) {
    case "palos":
      return { token: "palos", wildcard: true }; // "palos de la frontera"
    case "lucenaDelPuerto":
      return { token: "lucena", wildcard: true };
    case "paternaDelCampo":
      // Caso especial: usar token corto sin wildcard
      return { token: "paterna", wildcard: false };
    // Note: paternaDelCampo intentionally NOT wildcarded — data appears to use short token "paterna"
    case "rocianaDelCondado":
      return { token: "rociana", wildcard: true };
    case "laPalmaDelCondado":
      return { token: "la palma", wildcard: true };
    default: {
      const label = TOWN_META[townId].label; // p.ej. "Niebla"
      return { token: toToken(label), wildcard: false };
    }
  }
}

/**
 * Devuelve token y wildcard para categorías (pensando en Nivel 2 futuro).
 * Por ahora sólo definimos algunos prefijos útiles.
 */
export function getCategorySearchPattern(categoryId: CategoryId): {
  token: string;
  wildcard: boolean;
} {
  switch (categoryId) {
    case "espaciosMuseisticos":
      return { token: "espacios", wildcard: true }; // "espacios museísticos"
    case "rutasCulturales":
      return { token: "rutas culturales", wildcard: false };
    case "rutasSenderismo":
      return { token: "rutas senderismo y cicloturistas", wildcard: false };
    case "fiestasTradiciones":
      return { token: "fiestas y tradiciones", wildcard: false };
    case "lugaresColombinos":
      return { token: "lugares colombinos", wildcard: false };
    case "laRabida":
      return { token: "la rabida", wildcard: false };
    case "circuitoMonteblanco":
      return { token: "circuito monteblanco", wildcard: false };
    case "donana":
      return { token: "doñana", wildcard: false };
    case "playas":
      return { token: "playas", wildcard: false };
    case "patrimonio":
      return { token: "patrimonio", wildcard: false };
    case "sabor":
      return { token: "sabor", wildcard: false };
    default:
      return { token: categoryId, wildcard: false };
  }
}
