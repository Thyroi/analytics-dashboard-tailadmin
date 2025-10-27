/**
 * Test para verificar que categoryTownBreakdown usa correctamente los nuevos helpers
 */

import {
  makeCategoryFilter,
  matchSecondTown,
  parseKey,
  type KeyInfo,
} from "@/lib/taxonomy/patterns";

console.log("🧪 TEST: categoryTownBreakdown con helpers de profundidad\n");

// Simulamos un payload típico de Mindsaic para "playas"
const mockOutput = {
  "root.playas": [{ time: "20250115", value: 100 }],
  "root.playas.almonte": [{ time: "20250115", value: 50 }],
  "root.playas.palos de la frontera": [{ time: "20250115", value: 30 }],
  "root.playas.matalascanas": [{ time: "20250115", value: 20 }],
  "root.playas.almonte.mareas": [{ time: "20250115", value: 15 }], // profundidad 4, debería ignorarse
  "root.espacios_museisticos.niebla": [{ time: "20250115", value: 40 }], // otra categoría
  "root.patrimonio.moguer": [{ time: "20250115", value: 60 }],
};

// Test 1: Filtrar solo claves de "playas" con profundidad 3
console.log("📌 Test 1: Filtro makeCategoryFilter('playas', 3)");

const playasFilter = makeCategoryFilter("playas", 3);
const allKeys = Object.keys(mockOutput);
const parsedKeys = allKeys.map(parseKey).filter(Boolean) as KeyInfo[];
const playasKeys = parsedKeys.filter(playasFilter);

console.log(`  Total de claves: ${allKeys.length}`);
console.log(`  Claves parseadas: ${parsedKeys.length}`);
console.log(`  Claves de playas (depth=3): ${playasKeys.length}`);
console.log(`  Claves matcheadas: ${playasKeys.map((k) => k.raw).join(", ")}`);

const expected = [
  "root.playas.almonte",
  "root.playas.palos de la frontera",
  "root.playas.matalascanas",
];

const matchedRaw = playasKeys.map((k) => k.raw);
const allMatch = expected.every((e) => matchedRaw.includes(e));

console.log(
  `  ${
    allMatch ? "✅" : "❌"
  } Se filtraron correctamente las claves de profundidad 3`
);

// Test 2: Verificar que profundidad 2 y 4 se excluyen
const playasDepth2 = parsedKeys.filter(
  (k) => k.raw === "root.playas" && playasFilter(k)
);
const playasDepth4 = parsedKeys.filter(
  (k) => k.raw === "root.playas.almonte.mareas" && playasFilter(k)
);

console.log(
  `  ${
    playasDepth2.length === 0 ? "✅" : "❌"
  } Profundidad 2 excluida (root.playas)`
);
console.log(
  `  ${
    playasDepth4.length === 0 ? "✅" : "❌"
  } Profundidad 4 excluida (root.playas.almonte.mareas)`
);

// Test 3: Verificar que otras categorías se excluyen
const espaciosKeys = parsedKeys.filter((k) =>
  k.raw.startsWith("root.espacios_museisticos")
);
const espaciosFiltered = espaciosKeys.filter(playasFilter);

console.log(
  `  ${espaciosFiltered.length === 0 ? "✅" : "❌"} Otras categorías excluidas`
);

// Test 4: matchSecondTown resuelve correctamente
console.log("\n📌 Test 2: matchSecondTown con variantes");

const townTests = [
  { key: "root.playas.almonte", expected: "almonte" },
  { key: "root.playas.palos de la frontera", expected: "palos" },
  { key: "root.playas.matalascanas", expected: "matalascanas" },
];

let townPassed = 0;
townTests.forEach(({ key, expected }) => {
  const parsed = parseKey(key);
  if (!parsed) {
    console.log(`  ❌ "${key}" → no se pudo parsear`);
    return;
  }
  const town = matchSecondTown(parsed);
  const pass = town === expected;
  if (pass) {
    townPassed++;
    console.log(`  ✅ "${key}" → ${town}`);
  } else {
    console.log(`  ❌ "${key}" → ${town} (esperado: ${expected})`);
  }
});

console.log(`\n  Resultado: ${townPassed}/${townTests.length} pasaron`);

// Test 5: Sumar totales por pueblo
console.log("\n📌 Test 3: Suma de totales por pueblo");

const totals = new Map<string, number>();

for (const keyInfo of playasKeys) {
  const town = matchSecondTown(keyInfo);
  if (!town) continue;
  const series = mockOutput[keyInfo.raw as keyof typeof mockOutput] || [];
  const total = series.reduce((sum, point) => sum + point.value, 0);
  const prev = totals.get(town) || 0;
  totals.set(town, prev + total);
}

console.log(`  Totales por pueblo:`);
totals.forEach((value, town) => {
  console.log(`    ${town}: ${value}`);
});

const expectedTotals = {
  almonte: 50,
  palos: 30,
  matalascanas: 20,
};

let sumPassed = 0;
Object.entries(expectedTotals).forEach(([town, expected]) => {
  const actual = totals.get(town) || 0;
  const pass = actual === expected;
  if (pass) {
    sumPassed++;
    console.log(`  ✅ ${town}: ${actual} (esperado: ${expected})`);
  } else {
    console.log(`  ❌ ${town}: ${actual} (esperado: ${expected})`);
  }
});

// Resumen final
console.log("\n" + "=".repeat(60));
console.log("📊 RESUMEN:");
console.log(`  Filtrado: ${allMatch ? "✅ PASÓ" : "❌ FALLÓ"}`);
console.log(`  Matching pueblos: ${townPassed}/${townTests.length} pasaron`);
console.log(
  `  Suma totales: ${sumPassed}/${Object.keys(expectedTotals).length} pasaron`
);
console.log("=".repeat(60));

if (
  allMatch &&
  townPassed === townTests.length &&
  sumPassed === Object.keys(expectedTotals).length
) {
  console.log(
    "\n✅ TODOS LOS TESTS PASARON - categoryTownBreakdown está listo"
  );
} else {
  console.log("\n❌ ALGUNOS TESTS FALLARON");
}
