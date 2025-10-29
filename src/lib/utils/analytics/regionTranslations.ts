/**
 * Traducciones de nombres de regiones/comunidades autónomas de inglés a español
 * GA4 devuelve los nombres en inglés por defecto
 */

export const COUNTRY_TRANSLATIONS: Record<string, string> = {
  // Países principales
  Spain: "España",
  "United States": "Estados Unidos",
  "United Kingdom": "Reino Unido",
  France: "Francia",
  Germany: "Alemania",
  Italy: "Italia",
  Portugal: "Portugal",
  Netherlands: "Países Bajos",
  Belgium: "Bélgica",
  Switzerland: "Suiza",
  Austria: "Austria",
  Poland: "Polonia",
  Romania: "Rumania",
  "Czech Republic": "República Checa",
  Greece: "Grecia",
  Sweden: "Suecia",
  Denmark: "Dinamarca",
  Norway: "Noruega",
  Finland: "Finlandia",
  Ireland: "Irlanda",
  Mexico: "México",
  Argentina: "Argentina",
  Colombia: "Colombia",
  Chile: "Chile",
  Peru: "Perú",
  Venezuela: "Venezuela",
  Ecuador: "Ecuador",
  Brazil: "Brasil",
  Canada: "Canadá",
  China: "China",
  Japan: "Japón",
  India: "India",
  Russia: "Rusia",
  Australia: "Australia",
  "New Zealand": "Nueva Zelanda",
  "South Korea": "Corea del Sur",
  Turkey: "Turquía",
  Morocco: "Marruecos",
  Egypt: "Egipto",
  "South Africa": "Sudáfrica",
};

export const REGION_TRANSLATIONS: Record<string, string> = {
  // Comunidades Autónomas de España
  "Community of Madrid": "Comunidad de Madrid",
  Catalonia: "Cataluña",
  "Valencian Community": "Comunidad Valenciana",
  Andalusia: "Andalucía",
  Galicia: "Galicia",
  "Castile and León": "Castilla y León",
  "Basque Country": "País Vasco",
  "Canary Islands": "Islas Canarias",
  "Castile-La Mancha": "Castilla-La Mancha",
  Murcia: "Región de Murcia",
  Aragon: "Aragón",
  Extremadura: "Extremadura",
  "Balearic Islands": "Islas Baleares",
  Asturias: "Principado de Asturias",
  Navarre: "Navarra",
  Cantabria: "Cantabria",
  "La Rioja": "La Rioja",
  Ceuta: "Ceuta",
  Melilla: "Melilla",

  // Provincias/Ciudades comunes que pueden aparecer
  Madrid: "Madrid",
  Barcelona: "Barcelona",
  Valencia: "Valencia",
  Seville: "Sevilla",
  Zaragoza: "Zaragoza",
  Málaga: "Málaga",
  Palma: "Palma",
  "Las Palmas": "Las Palmas",
  Bilbao: "Bilbao",
  Alicante: "Alicante",
  Córdoba: "Córdoba",
  Valladolid: "Valladolid",
  Vigo: "Vigo",
  Gijón: "Gijón",
  "Hospitalet de Llobregat": "Hospitalet de Llobregat",
  "A Coruña": "A Coruña",
  Granada: "Granada",
  "Vitoria-Gasteiz": "Vitoria-Gasteiz",
  "Santa Cruz de Tenerife": "Santa Cruz de Tenerife",
  Pamplona: "Pamplona",
  Almería: "Almería",
  Santander: "Santander",
  Logroño: "Logroño",
  Oviedo: "Oviedo",
  Salamanca: "Salamanca",
  Huelva: "Huelva",
  Badajoz: "Badajoz",
  Cádiz: "Cádiz",
  Tarragona: "Tarragona",
};

/**
 * Traduce un nombre de país de inglés a español
 * @param englishName - Nombre en inglés desde GA4
 * @returns Nombre en español o el original si no hay traducción
 */
export function translateCountry(englishName: string): string {
  return COUNTRY_TRANSLATIONS[englishName] ?? englishName;
}

/**
 * Traduce un nombre de región de inglés a español
 * @param englishName - Nombre en inglés desde GA4
 * @returns Nombre en español o el original si no hay traducción
 */
export function translateRegion(englishName: string): string {
  return REGION_TRANSLATIONS[englishName] ?? englishName;
}

/**
 * Obtiene el nombre en inglés a partir del nombre en español
 * @param spanishName - Nombre en español
 * @returns Nombre en inglés o el original si no hay traducción inversa
 */
export function getEnglishRegionName(spanishName: string): string {
  const entry = Object.entries(REGION_TRANSLATIONS).find(
    ([, esp]) => esp === spanishName
  );
  return entry ? entry[0] : spanishName;
}

/**
 * Traduce un array de nombres de regiones
 */
export function translateRegions(names: string[]): string[] {
  return names.map(translateRegion);
}
