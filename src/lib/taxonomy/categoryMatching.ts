/**
 * Matching de categorías con manejo de casos especiales y variantes ortográficas
 */

/**
 * Helper para verificar si un path/texto contiene una categoría específica
 * Maneja casos especiales con diferentes variantes ortográficas
 */
export function matchesCategory(text: string, targetCategory: string): boolean {
  const textLower = text.toLowerCase();

  if (targetCategory === "espaciosMuseisticos") {
    return (
      textLower.includes("espacios") &&
      (textLower.includes("museisticos") ||
        textLower.includes("museísticos") ||
        textLower.includes("museíticos") ||
        textLower.includes("museiticos"))
    );
  } else if (targetCategory === "fiestasTradiciones") {
    return (
      textLower.includes("fiestas") ||
      textLower.includes("festivals") ||
      (textLower.includes("fiestas") && textLower.includes("tradiciones"))
    );
  } else if (targetCategory === "rutasCulturales") {
    return (
      (textLower.includes("rutas") && textLower.includes("culturales")) ||
      textLower.includes("rutas_culturales") ||
      textLower.includes("rutas-culturales") ||
      textLower.includes("cultural-routes") ||
      textLower.includes("cultural_routes") ||
      // Caso especial: "rutas" a secas también puede ser cultural (según comentario en taxonomy)
      (textLower.includes("root.rutas") && !textLower.includes("senderismo"))
    );
  } else if (targetCategory === "rutasSenderismo") {
    return (
      textLower.includes("senderismo") ||
      textLower.includes("hiking") ||
      (textLower.includes("rutas") && textLower.includes("senderismo"))
    );
  } else if (targetCategory === "patrimonio") {
    return textLower.includes("patrimonio") || textLower.includes("heritage");
  } else if (targetCategory === "naturaleza") {
    return textLower.includes("naturaleza") || textLower.includes("nature");
  } else if (targetCategory === "playas") {
    return textLower.includes("playas") || textLower.includes("beaches");
  } else if (targetCategory === "sabor") {
    return (
      textLower.includes("sabor") ||
      textLower.includes("gastronomía") ||
      textLower.includes("gastronomia") ||
      textLower.includes("gastronomy")
    );
  } else if (targetCategory === "donana") {
    return (
      textLower.includes("donana") ||
      textLower.includes("doñana") ||
      textLower.includes("donaña")
    );
  } else if (targetCategory === "circuitoMonteblanco") {
    return (
      textLower.includes("monteblanco") || textLower.includes("monte blanco")
    );
  } else if (targetCategory === "laRabida") {
    return (
      textLower.includes("rabida") ||
      textLower.includes("rábida") ||
      textLower.includes("la rabida") ||
      textLower.includes("la rábida")
    );
  } else if (targetCategory === "lugaresColombinos") {
    return (
      textLower.includes("colombinos") ||
      textLower.includes("colombino") ||
      textLower.includes("columbus") ||
      (textLower.includes("lugares") && textLower.includes("colombinos"))
    );
  }

  // Fallback: match directo
  return textLower.includes(targetCategory.toLowerCase());
}
