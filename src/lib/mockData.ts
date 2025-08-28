// src/lib/mockData.ts
// Datos "quemados": series diarias por tagPath
export type SeriesDict = Record<string, Record<string, number>>;

// ---------- RANGO DE FECHAS QUE GENERA MOCK ----------
const START = "2025-05-01";
const END   = "2025-08-31";

// Heroicons (para la metadata de cada tag raíz)
import type * as React from "react";
import {
  SunIcon,
  MapIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  ShoppingBagIcon,
  SparklesIcon,
  FlagIcon,
  BugAntIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

// ---------- Metadata UI por tag raíz ----------
export type TagMeta = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; // tailwind classes para el “chip”
};

/**
 * TAG_META: estilos e íconos por cada tag raíz.
 * (puedes ajustar colores/icons a tu gusto)
 */
export const TAG_META: Record<string, TagMeta> = {
  circuitoMonteblanco: { label: "Circuito Monteblanco", icon: FlagIcon,              color: "bg-indigo-50 text-indigo-600 dark:bg-white/5 dark:text-indigo-300" },
  donana:              { label: "Doñana",              icon: BugAntIcon,               color: "bg-emerald-50 text-emerald-600 dark:bg-white/5 dark:text-emerald-300" },
  espaciosMuseisticos: { label: "Espacios museísticos",icon: BuildingLibraryIcon,    color: "bg-sky-50 text-sky-600 dark:bg-white/5 dark:text-sky-300" },
  fiestasTradiciones:  { label: "Fiestas y tradiciones",icon: SparklesIcon,          color: "bg-fuchsia-50 text-fuchsia-600 dark:bg-white/5 dark:text-fuchsia-300" },
  laRabida:            { label: "La Rábida",           icon: BuildingOffice2Icon,    color: "bg-rose-50 text-rose-600 dark:bg-white/5 dark:text-rose-300" },
  lugaresColombinos:   { label: "Lugares colombinos",  icon: MapIcon,                color: "bg-teal-50 text-teal-600 dark:bg-white/5 dark:text-teal-300" },
  naturaleza:          { label: "Naturaleza",          icon: MapPinIcon,             color: "bg-orange-50 text-orange-600 dark:bg-white/5 dark:text-orange-300" },
  patrimonio:          { label: "Patrimonio",          icon: HomeModernIcon,         color: "bg-violet-50 text-violet-600 dark:bg-white/5 dark:text-violet-300" },
  playa:               { label: "Playa",               icon: SunIcon,                color: "bg-blue-50 text-blue-600 dark:bg-white/5 dark:text-blue-300" },
  rutasCulturales:     { label: "Rutas culturales",    icon: MapIcon,                color: "bg-amber-50 text-amber-600 dark:bg-white/5 dark:text-amber-300" },
  rutasSenderismo:     { label: "Rutas senderismo y cicloturistas", icon: MapIcon,   color: "bg-lime-50 text-lime-600 dark:bg-white/5 dark:text-lime-300" },
  sabor:               { label: "Sabor",               icon: ShoppingBagIcon,        color: "bg-pink-50 text-pink-600 dark:bg-white/5 dark:text-pink-300" },
  pueblos:             { label: "Pueblos",             icon: MapPinIcon,             color: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200" },
  // (si en el futuro agregas “museos”, “deportes”, etc. puedes extender aquí)
};

// Fallback para tags no mapeados
export const DEFAULT_TAG_META: TagMeta = {
  label: "Desconocido",
  icon: QuestionMarkCircleIcon,
  color: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
};

// ---------- Definición de tags y subtags ----------
// Subtags inventados (slugs) coherentes con cada ámbito.
// Para “pueblos” usamos exactamente la lista que nos diste.
const TAG_SPECS: Array<{ id: string; subtags: string[] }> = [
  {
    id: "circuitoMonteblanco",
    subtags: ["eventos", "carreras", "escuela", "visitas", "alquilerPista"],
  },
  {
    id: "donana",
    subtags: ["fauna", "flora", "rutas", "avistamiento", "centrosVisita"],
  },
  {
    id: "espaciosMuseisticos",
    subtags: ["exposiciones", "horarios", "entradas", "guias", "talleres"],
  },
  {
    id: "fiestasTradiciones",
    subtags: ["romerias", "carnavales", "ferias", "gastronomia", "artesanias"],
  },
  {
    id: "laRabida",
    subtags: ["monasterio", "jardines", "muelleCarabelas", "eventos", "miradores"],
  },
  {
    id: "lugaresColombinos",
    subtags: ["rutasHistoricas", "monumentos", "centrosInterpretacion", "muelleCarabelas", "miradores"],
  },
  {
    id: "naturaleza",
    subtags: ["parques", "senderos", "miradores", "rios", "playasNaturales"],
  },
  {
    id: "patrimonio",
    subtags: ["castillos", "iglesias", "murallas", "plazasHistoricas", "yacimientos"],
  },
  {
    id: "playa",
    subtags: ["servicios", "banderaAzul", "chiringuitos", "accesibilidad", "deportesAcuaticos"],
  },
  {
    id: "rutasCulturales",
    subtags: ["barroco", "colombina", "vinicola", "minera", "industrial"],
  },
  {
    id: "rutasSenderismo",
    subtags: ["familiares", "intermedias", "avanzadas", "btt", "viasVerdes"],
  },
  {
    id: "sabor",
    subtags: ["vinos", "jamon", "mariscos", "tapas", "mercados"],
  },
  {
    id: "pueblos",
    subtags: [
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
      "sinCategoria",
      "villalba",
      "villarrasa",
    ],
  },
];

// ---------- Ponderadores según “items” (tu entrada) ----------
/** Peso por TAG raíz para escalar su volumen total. */
const TAG_ITEM_HINTS: Record<string, number> = {
  circuitoMonteblanco: 2,
  donana: 21,
  espaciosMuseisticos: 27,
  fiestasTradiciones: 130,
  laRabida: 10,
  lugaresColombinos: 7,
  naturaleza: 36,
  patrimonio: 151,
  playa: 7,
  rutasCulturales: 5,
  rutasSenderismo: 59,
  sabor: 0,
  pueblos: 0, // se reparte por subtags abajo
};

/** Peso por SUBTAG (solo donde nos diste valores —pueblos—). */
const SUBTAG_ITEM_HINTS: Record<string, Record<string, number>> = {
  pueblos: {
    almonte: 56,
    bollullos: 25,
    bonares: 22,
    chucena: 15,
    crucesMayoBonares: 8,
    escacena: 25,
    hinojos: 26,
    laPalmaDelCondado: 31,
    lucenaDelPuerto: 16,
    manzanilla: 19,
    niebla: 27,
    palos: 29,
    paternaDelCampo: 37,
    puertasMurallaNiebla: 5,
    rocianaDelCondado: 20,
    sinCategoria: 2,
    villalba: 19,
    villarrasa: 22,
  },
};

// ---------- Utilidades deterministas (PRNG) ----------
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function dateRangeDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d0 = new Date(startISO + "T00:00:00Z");
  const d1 = new Date(endISO   + "T00:00:00Z");
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return out;
}

// ---------- Generación de las series ----------
function normalizeWeights(obj: Record<string, number>): Record<string, number> {
  const total = Object.values(obj).reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const n = Object.keys(obj).length || 1;
    const eq = 1 / n;
    const out: Record<string, number> = {};
    Object.keys(obj).forEach((k) => (out[k] = eq));
    return out;
  }
  const out: Record<string, number> = {};
  Object.entries(obj).forEach(([k, v]) => (out[k] = v / total));
  return out;
}

function buildMockSeries(): SeriesDict {
  const dates = dateRangeDays(START, END);
  const series: SeriesDict = {};

  const maxTagItems = Math.max(1, ...Object.values(TAG_ITEM_HINTS));

  for (const { id: tag, subtags } of TAG_SPECS) {
    // Semilla por tag para patrones estables
    const rndTag = mulberry32(hashStr(tag));

    // Base por popularidad (según items): 80–220 aprox.
    const popularity = TAG_ITEM_HINTS[tag] ?? 0;
    const baseMean = Math.round(80 + (popularity / maxTagItems) * (220 - 80));

    const amplitude = 0.35 + rndTag() * 0.35; // 0.35–0.70
    const phase = rndTag() * Math.PI * 2;

    // Pesos por subtag
    const weightMap: Record<string, number> = {};
    const subHints = SUBTAG_ITEM_HINTS[tag];

    if (subHints) {
      // Si tenemos hints concretos (pueblos), los usamos.
      subtags.forEach((s) => {
        weightMap[s] = subHints[s] ?? 1;
      });
    } else {
      // Caso general: pesos pseudo-aleatorios estables pero repartidos
      subtags.forEach((s) => {
        const r = 0.6 + mulberry32(hashStr(`${tag}.${s}:w`))() * 1.4; // 0.6–2.0
        weightMap[s] = r;
      });
    }

    const weights = normalizeWeights(weightMap);

    // Inicializar contenedores
    series[tag] = {};
    for (const s of subtags) series[`${tag}.${s}`] = {};

    // Para cada día
    dates.forEach((date, idx) => {
      const season = Math.sin(idx / 18 + phase); // ciclo ~36 días
      const dow = new Date(date + "T00:00:00Z").getUTCDay(); // 0..6
      const weekendBoost = (dow === 0 || dow === 6) ? 1.12 : 1.0;
      const noise = (rndTag() - 0.5) * 0.18; // ±9%

      let total = baseMean * (1 + amplitude * season) * weekendBoost * (1 + noise);
      if (total < 0) total = 0;

      // repartir entre subtags según pesos + pequeño jitter
      let sumSub = 0;
      const parts: Record<string, number> = {};
      subtags.forEach((s) => {
        const r = mulberry32(hashStr(`${tag}.${s}:${date}`))();
        const jitter = 0.9 + r * 0.2; // 0.9–1.1
        const val = Math.max(0, Math.round(total * weights[s] * jitter));
        parts[s] = val;
        sumSub += val;
      });

      // guardar subtags
      subtags.forEach((s) => {
        series[`${tag}.${s}`][date] = parts[s];
      });

      // el nivel del tag = suma de subtags (consistente)
      series[tag][date] = sumSub;
    });
  }
  return series;
}

// ---------- Export: SERIES quemado ----------
export const SERIES: SeriesDict = buildMockSeries();

/** Helpers opcionales (por si te sirven en más lugares) */
export function getLastDate(series: SeriesDict = SERIES): string {
  let last = "";
  for (const [key, byDate] of Object.entries(series)) {
    if (key.includes(".")) continue;
    for (const date of Object.keys(byDate)) {
      if (date > last) last = date;
    }
  }
  return last;
}

// Mapeo tailwind -> HEX (para chips/leyendas)
const TAILWIND_TO_HEX: Record<string, string> = {
  "text-blue-600": "#2563EB",
  "text-emerald-600": "#059669",
  "text-amber-600": "#D97706",
  "text-rose-600": "#E11D48",
  "text-slate-700": "#334155",
  "text-fuchsia-600": "#C026D3",
  "text-orange-600": "#EA580C",
  "text-teal-600": "#0D9488",
  "text-violet-600": "#7C3AED",
  "text-indigo-600": "#4F46E5",
  "text-sky-600": "#0284C7",
  "text-lime-600": "#65A30D",
  "text-pink-600": "#DB2777",
  "text-gray-600": "#4B5563",
  "text-gray-700": "#374151",
};

/** Extrae el primer token "text-*-N" de meta.color y lo pasa a HEX */
function metaToHex(meta: TagMeta): string {
  const token = meta.color.split(/\s+/).find((c) => c.startsWith("text-"));
  return (token && TAILWIND_TO_HEX[token]) || TAILWIND_TO_HEX["text-gray-600"];
}

/** Colores HEX por tag raíz (clave = id del tag en SERIES) */
export const TAG_COLOR_HEX_BY_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(TAG_META).map(([tag, meta]) => [tag, metaToHex(meta)])
);

/** Colores HEX por etiqueta mostrada (clave = meta.label) */
export const TAG_COLOR_HEX_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(TAG_META).map((meta) => [meta.label, metaToHex(meta)])
);
