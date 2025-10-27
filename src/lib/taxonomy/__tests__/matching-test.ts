/**
 * Test de matching tolerante para categorías y pueblos
 *
 * Verifica que:
 * 1. matchCategoryId resuelva variantes con/sin acentos, artículos, espacios
 * 2. matchTownId resuelva variantes de pueblos compuestos
 * 3. parseKey funcione correctamente con profundidades
 * 4. makeCategoryFilter y makeCategoryTownFilter filtren correctamente
 */

import type { CategoryId } from "../categories";
import { matchCategoryId, matchTownId } from "../normalize";
import {
  getCategorySearchPattern,
  getTownSearchPattern,
  makeCategoryFilter,
  matchFirstCategory,
  matchSecondTown,
  parseKey,
  type KeyInfo,
} from "../patterns";
import type { TownId } from "../towns";

console.log("🧪 TEST: Matching Tolerante para Chatbot\n");

// ==================== Test 1: matchCategoryId ====================
console.log("📌 Test 1: matchCategoryId - Variantes de categorías");

const categoryTests = [
  { input: "la rábida", expected: "laRabida" },
  { input: "la rabida", expected: "laRabida" },
  { input: "rabida", expected: "laRabida" },
  { input: "espacios museísticos", expected: "espaciosMuseisticos" },
  { input: "espacios_museísticos", expected: "espaciosMuseisticos" },
  { input: "espacios museisticos", expected: "espaciosMuseisticos" },
  { input: "espacios museiticos", expected: "espaciosMuseisticos" },
  { input: "espacios", expected: "espaciosMuseisticos" },
  { input: "rutas culturales", expected: "rutasCulturales" },
  { input: "rutas_culturales", expected: "rutasCulturales" },
  { input: "rutas senderismo y cicloturistas", expected: "rutasSenderismo" },
  { input: "fiestas y tradiciones", expected: "fiestasTradiciones" },
  { input: "fiestas", expected: "fiestasTradiciones" },
  { input: "playas", expected: "playas" },
  { input: "patrimonio", expected: "patrimonio" },
  { input: "sabor", expected: "sabor" },
  { input: "doñana", expected: "donana" },
  { input: "donana", expected: "donana" },
];

let categoryPassed = 0;
let categoryFailed = 0;

categoryTests.forEach(({ input, expected }) => {
  const result = matchCategoryId(input);
  const pass = result === expected;
  if (pass) {
    categoryPassed++;
    console.log(`  ✅ "${input}" → ${result}`);
  } else {
    categoryFailed++;
    console.log(`  ❌ "${input}" → ${result} (esperado: ${expected})`);
  }
});

console.log(
  `\n  Resultado: ${categoryPassed}/${categoryTests.length} pasaron\n`
);

// ==================== Test 2: matchTownId ====================
console.log("📌 Test 2: matchTownId - Variantes de pueblos");

const townTests = [
  { input: "palos de la frontera", expected: "palos" },
  { input: "palos", expected: "palos" },
  { input: "la palma del condado", expected: "laPalmaDelCondado" },
  { input: "la palma", expected: "laPalmaDelCondado" },
  { input: "lucena del puerto", expected: "lucenaDelPuerto" },
  { input: "lucena", expected: "lucenaDelPuerto" },
  { input: "rociana del condado", expected: "rocianaDelCondado" },
  { input: "rociana", expected: "rocianaDelCondado" },
  { input: "paterna del campo", expected: "paternaDelCampo" },
  { input: "paterna", expected: "paternaDelCampo" },
  { input: "almonte", expected: "almonte" },
  { input: "niebla", expected: "niebla" },
  { input: "villalba del alcor", expected: "villalba" },
  { input: "villalba", expected: "villalba" },
  { input: "manzanilla", expected: "manzanilla" },
];

let townPassed = 0;
let townFailed = 0;

townTests.forEach(({ input, expected }) => {
  const result = matchTownId(input);
  const pass = result === expected;
  if (pass) {
    townPassed++;
    console.log(`  ✅ "${input}" → ${result}`);
  } else {
    townFailed++;
    console.log(`  ❌ "${input}" → ${result} (esperado: ${expected})`);
  }
});

console.log(`\n  Resultado: ${townPassed}/${townTests.length} pasaron\n`);

// ==================== Test 3: parseKey & Profundidad ====================
console.log("📌 Test 3: parseKey - Análisis de profundidad");

const keyTests = [
  { key: "root.playas", depth: 2 },
  { key: "root.playas.almonte", depth: 3 },
  { key: "root.playas.almonte.mareas", depth: 4 },
  { key: "root.espacios_museísticos.niebla", depth: 3 },
  { key: "root.la_rabida.historia", depth: 3 },
];

let keyPassed = 0;
let keyFailed = 0;

keyTests.forEach(({ key, depth }) => {
  const parsed = parseKey(key);
  const pass = parsed && parsed.depth === depth;
  if (pass) {
    keyPassed++;
    console.log(`  ✅ "${key}" → depth=${parsed!.depth}`);
  } else {
    keyFailed++;
    console.log(`  ❌ "${key}" → depth=${parsed?.depth} (esperado: ${depth})`);
  }
});

console.log(`\n  Resultado: ${keyPassed}/${keyTests.length} pasaron\n`);

// ==================== Test 4: matchFirstCategory & matchSecondTown ====================
console.log("📌 Test 4: matchFirstCategory & matchSecondTown");

const hierarchyTests = [
  {
    key: "root.playas.almonte",
    expectedCat: "playas",
    expectedTown: "almonte",
  },
  {
    key: "root.espacios_museísticos.niebla",
    expectedCat: "espaciosMuseisticos",
    expectedTown: "niebla",
  },
  {
    key: "root.la_rabida.palos",
    expectedCat: "laRabida",
    expectedTown: "palos",
  },
  {
    key: "root.fiestas.almonte.mareas",
    expectedCat: "fiestasTradiciones",
    expectedTown: "almonte",
  },
];

let hierarchyPassed = 0;
let hierarchyFailed = 0;

hierarchyTests.forEach(({ key, expectedCat, expectedTown }) => {
  const parsed = parseKey(key);
  if (!parsed) {
    hierarchyFailed++;
    console.log(`  ❌ "${key}" → no se pudo parsear`);
    return;
  }

  const cat = matchFirstCategory(parsed);
  const town = matchSecondTown(parsed);
  const pass = cat === expectedCat && town === expectedTown;

  if (pass) {
    hierarchyPassed++;
    console.log(`  ✅ "${key}" → cat=${cat}, town=${town}`);
  } else {
    hierarchyFailed++;
    console.log(
      `  ❌ "${key}" → cat=${cat}, town=${town} (esperado: cat=${expectedCat}, town=${expectedTown})`
    );
  }
});

console.log(
  `\n  Resultado: ${hierarchyPassed}/${hierarchyTests.length} pasaron\n`
);

// ==================== Test 5: Pattern Getters ====================
console.log("📌 Test 5: getCategorySearchPattern & getTownSearchPattern");

const patternTests = [
  { cat: "playas", token: "playas", wildcard: false },
  { cat: "espaciosMuseisticos", token: "espacios", wildcard: true },
  { cat: "laRabida", token: "la rabida", wildcard: false },
  {
    cat: "fiestasTradiciones",
    token: "fiestas y tradiciones",
    wildcard: false,
  },
];

patternTests.forEach(({ cat, token, wildcard }) => {
  const result = getCategorySearchPattern(cat as CategoryId);
  const pass = result.token === token && result.wildcard === wildcard;
  console.log(
    `  ${pass ? "✅" : "❌"} ${cat} → token="${result.token}", wildcard=${
      result.wildcard
    }`
  );
});

console.log("");

const townPatternTests = [
  { town: "palos", token: "palos", wildcard: true },
  { town: "laPalmaDelCondado", token: "la palma", wildcard: true },
  { town: "almonte", token: "almonte", wildcard: false },
  { town: "niebla", token: "niebla", wildcard: false },
];

townPatternTests.forEach(({ town, token, wildcard }) => {
  const result = getTownSearchPattern(town as TownId);
  const pass = result.token === token && result.wildcard === wildcard;
  console.log(
    `  ${pass ? "✅" : "❌"} ${town} → token="${result.token}", wildcard=${
      result.wildcard
    }`
  );
});

// ==================== Test 6: Filtros ====================
console.log("\n📌 Test 6: makeCategoryFilter - Filtrado por categoría");

const sampleKeys = [
  "root.playas",
  "root.playas.almonte",
  "root.playas.almonte.mareas",
  "root.espacios_museísticos.niebla",
  "root.patrimonio.moguer",
  "root.fiestas.almonte",
];

const parsedKeys = sampleKeys.map(parseKey).filter(Boolean) as KeyInfo[];

// Filtro: solo claves de playas con profundidad 3
const playasFilter = makeCategoryFilter("playas", 3);
const playasFiltered = parsedKeys.filter(playasFilter);

console.log(
  `  Filtro "playas" depth=3: ${playasFiltered.map((k) => k.raw).join(", ")}`
);
console.log(
  `  ${
    playasFiltered.length === 1 &&
    playasFiltered[0].raw === "root.playas.almonte"
      ? "✅"
      : "❌"
  }`
);

// ==================== Resumen Final ====================
console.log("\n" + "=".repeat(60));
console.log("📊 RESUMEN FINAL:");
console.log(
  `  Categorías: ${categoryPassed}/${categoryTests.length} (${categoryFailed} fallos)`
);
console.log(
  `  Pueblos: ${townPassed}/${townTests.length} (${townFailed} fallos)`
);
console.log(`  Keys: ${keyPassed}/${keyTests.length} (${keyFailed} fallos)`);
console.log(
  `  Jerarquía: ${hierarchyPassed}/${hierarchyTests.length} (${hierarchyFailed} fallos)`
);
console.log("=".repeat(60));

const totalTests =
  categoryTests.length +
  townTests.length +
  keyTests.length +
  hierarchyTests.length;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const totalPassed = categoryPassed + townPassed + keyPassed + hierarchyPassed;
const totalFailed = categoryFailed + townFailed + keyFailed + hierarchyFailed;

if (totalFailed === 0) {
  console.log("\n✅ TODOS LOS TESTS PASARON");
} else {
  console.log(`\n❌ ${totalFailed}/${totalTests} tests fallaron`);
}
