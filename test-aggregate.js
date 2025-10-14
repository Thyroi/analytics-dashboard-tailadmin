// test-aggregate.js

// Mock de las categorías (copiado de tu taxonomía)
const CATEGORY_META = {
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
  playas: { id: "playas", label: "PLAYAS", iconSrc: "/tags/playa.png" },
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
  sabor: { id: "sabor", label: "SABOR", iconSrc: "/tags/sabor.png" },
  donana: { id: "donana", label: "DOÑANA", iconSrc: "/tags/donana.png" },
  circuitoMonteblanco: {
    id: "circuitoMonteblanco",
    label: "CIRCUITO MONTEBLANCO",
    iconSrc: "/tags/circuito.png",
  },
  laRabida: { id: "laRabida", label: "LA RÁBIDA", iconSrc: "/tags/rabida.png" },
  lugaresColombinos: {
    id: "lugaresColombinos",
    label: "LUGARES COLOMBINOS",
    iconSrc: "/tags/colombinos.png",
  },
};

const CATEGORY_SYNONYMS = {
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
    "espacios-museísticos",
    "espacios_museísticos",
    "espacios-museíticos",
    "espacios_museíticos",
    "museos",
    "museums",
    "museum-spaces",
    "museum_spaces",
  ],
  patrimonio: ["patrimonio", "heritage", "iglesias"],
  rutasCulturales: [
    "rutas-culturales",
    "rutas_culturales",
    "cultural-routes",
    "cultural_routes",
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
  donana: ["donana", "doñana"],
  circuitoMonteblanco: [
    "circuito-monteblanco",
    "circuito_monteblanco",
    "monteblanco",
  ],
  laRabida: ["la-rabida", "la_rabida", "rabida"],
  lugaresColombinos: [
    "lugares-colombinos",
    "lugares_colombinos",
    "colombinos",
    "lugares colombinos",
  ],
};

// Datos de prueba
const testData = {
  code: 200,
  output: {
    "root.Almonte": [{ time: "20250923", value: 1 }],
    "root.BOLLULLOS": [{ time: "20250923", value: 2 }],
    "root.Bonares": [{ time: "20251003", value: 1 }],
    "root.Lugares Colombinos": [{ time: "20251003", value: 2 }],
    "root.Playas": [{ time: "20251003", value: 2 }],
    "root.Sabor": [{ time: "20251001", value: 1 }],
    "root.acebrón": [{ time: "20251003", value: 1 }],
    "root.almonte": [
      { time: "20250919", value: 4 },
      { time: "20250920", value: 14 },
      { time: "20251003", value: 1 },
    ],
    "root.bollullos": [{ time: "20251003", value: 3 }],
    "root.bonares": [{ time: "20251001", value: 2 }],
    "root.condado": [
      { time: "20251001", value: 1 },
      { time: "20251003", value: 1 },
    ],
    "root.doñana": [
      { time: "20250922", value: 1 },
      { time: "20251001", value: 1 },
    ],
    "root.espacios_museisticos": [{ time: "20250922", value: 4 }],
    "root.espacios_museísticos": [{ time: "20250922", value: 1 }],
    "root.espacios_museíticos": [
      { time: "20251001", value: 1 },
      { time: "20251003", value: 1 },
    ],
    "root.fauna": [{ time: "20251003", value: 1 }],
    "root.fiestas y tradiciones": [{ time: "20251003", value: 2 }],
    "root.fiestas": [
      { time: "20250919", value: 1 },
      { time: "20251001", value: 1 },
    ],
    "root.fiestas_y_tradiciones": [
      { time: "20250923", value: 1 },
      { time: "20251003", value: 5 },
    ],
    "root.genéricas del condado": [{ time: "20251003", value: 2 }],
    "root.hinojos": [{ time: "20251001", value: 1 }],
    "root.iglesias": [{ time: "20251003", value: 1 }],
    "root.lucena_del_puerto.1": [{ time: "20250923", value: 2 }],
    "root.lucena_del_puerto": [{ time: "20250923", value: 2 }],
    "root.manzanilla": [{ time: "20250922", value: 1 }],
    "root.moguer": [{ time: "20250919", value: 8 }],
    "root.municipios": [{ time: "20251003", value: 1 }],
    "root.naturaleza": [
      { time: "20251001", value: 5 },
      { time: "20251002", value: 1 },
      { time: "20251003", value: 7 },
    ],
    "root.niebla": [
      { time: "20251001", value: 1 },
      { time: "20251003", value: 1 },
    ],
    "root.otros": [
      { time: "20250920", value: 1 },
      { time: "20250921", value: 1 },
      { time: "20250922", value: 1 },
      { time: "20251001", value: 11 },
      { time: "20251002", value: 2 },
      { time: "20251003", value: 10 },
    ],
    "root.palos de la frontera": [
      { time: "20250922", value: 1 },
      { time: "20251001", value: 1 },
      { time: "20251003", value: 2 },
    ],
    "root.palos": [{ time: "20250922", value: 1 }],
    "root.patrimonio": [{ time: "20251001", value: 3 }],
    "root.playa": [{ time: "20251001", value: 1 }],
    "root.playas": [
      { time: "20250919", value: 14 },
      { time: "20250920", value: 13 },
      { time: "20250922", value: 3 },
      { time: "20251001", value: 6 },
      { time: "20251003", value: 6 },
    ],
    "root.pueblos": [{ time: "20251003", value: 3 }],
    "root.rocío": [{ time: "20251003", value: 1 }],
    "root.rutas culturales": [{ time: "20251001", value: 2 }],
    "root.rutas": [
      { time: "20251001", value: 2 },
      { time: "20251003", value: 1 },
    ],
    "root.sabor": [
      { time: "20251001", value: 4 },
      { time: "20251003", value: 1 },
    ],
    "root.senderismo": [{ time: "20251001", value: 4 }],
    "root.torre del río del oro": [{ time: "20251001", value: 1 }],
    "root.torre": [{ time: "20251001", value: 1 }],
    "root.vías": [{ time: "20251001", value: 1 }],
  },
};

// Función de agregación (copiada de aggregateCategories.ts)
function norm(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toTokens(base) {
  const n = norm(base);
  const kebab = n.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const snake = n.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const compact = n.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([n, kebab, snake, compact].filter(Boolean)));
}

function buildCategoryTokenMap() {
  const map = new Map();
  Object.keys(CATEGORY_META).forEach((cid) => {
    const meta = CATEGORY_META[cid];
    const syns = CATEGORY_SYNONYMS[cid] ?? [];
    const baseTokens = [
      ...toTokens(cid),
      ...toTokens(meta.label),
      ...syns.flatMap(toTokens),
    ];
    for (const t of baseTokens) map.set(t, cid);
  });
  return map;
}

function sum(arr) {
  return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

function seriesDelta(points) {
  if (!points || points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.time.localeCompare(b.time));
  const last = sorted[sorted.length - 1]?.value ?? 0;
  const prev = sorted[sorted.length - 2]?.value ?? 0;
  return (Number(last) || 0) - (Number(prev) || 0);
}

function aggregateCategoriesForUI(apiOutput) {
  const tokenMap = buildCategoryTokenMap();

  console.log("🗺️ Token map generado (primeros 20):");
  Array.from(tokenMap.entries())
    .slice(0, 20)
    .forEach(([token, cat]) => {
      console.log(`  "${token}" -> ${cat}`);
    });

  const totals = new Map();

  console.log("\n🔍 Procesando keys del API:", Object.keys(apiOutput));

  for (const [rawKey, points] of Object.entries(apiOutput)) {
    const keyNoRoot = rawKey.startsWith("root.") ? rawKey.slice(5) : rawKey;
    const tokens = toTokens(keyNoRoot);

    console.log(`\n🔑 Key: "${rawKey}" -> keyNoRoot: "${keyNoRoot}"`);
    console.log(`   Tokens generados:`, tokens);

    let matched = null;
    for (const t of tokens) {
      const cid = tokenMap.get(t);
      if (cid) {
        matched = cid;
        console.log(
          `   ✅ Match encontrado: token "${t}" -> categoría "${cid}"`
        );
        break;
      }
    }

    if (!matched) {
      console.log(`   ❌ No match para "${rawKey}"`);
      continue;
    }

    const valueSum = sum(points.map((p) => Number(p.value) || 0));
    const dlt = seriesDelta(points);

    console.log(
      `   📊 Valores: [${points
        .map((p) => p.value)
        .join(", ")}] -> suma=${valueSum}, delta=${dlt}`
    );

    const prev = totals.get(matched) ?? { value: 0, delta: 0 };
    totals.set(matched, {
      value: prev.value + valueSum,
      delta: prev.delta + dlt,
    });

    console.log(
      `   ➕ Acumulado para "${matched}": ${prev.value} + ${valueSum} = ${
        prev.value + valueSum
      }`
    );
  }

  console.log("\n📈 Totales finales:");
  for (const [cid, agg] of totals.entries()) {
    console.log(`  ${cid}: value=${agg.value}, delta=${agg.delta}`);
  }

  const result = [];
  for (const [cid, agg] of totals.entries()) {
    const { label } = CATEGORY_META[cid];
    result.push({ id: cid, label, value: agg.value, delta: agg.delta });
  }

  result.sort((a, b) => b.value - a.value);

  return result;
}

// Ejecutar el test
console.log("🚀 Ejecutando aggregateCategoriesForUI con datos de prueba...\n");
const result = aggregateCategoriesForUI(testData.output);

console.log("\n🎯 RESULTADO FINAL:");
result.forEach((cat, i) => {
  console.log(`${i + 1}. ${cat.id}: ${cat.value} (${cat.label})`);
});
