// src/lib/mockData.ts
// ===============================================
//   Mock con profundidad arbitraria:
//   - Etiquetas visibles como tags raíz (nivel 1)
//   - Cada pueblo también es tag raíz (nivel 1)
//     -> dentro: todas las etiquetas visibles (nivel 2)
//        -> dentro: subtags de cada etiqueta (nivel 3)
//   Además se mantienen las rutas globales: p.ej. "playa.limpieza"
// ===============================================

export type SeriesDict = Record<string, Record<string, number>>;

// ---------- RANGO DE FECHAS QUE GENERA MOCK ----------
const START = "2025-05-01";
const END = "2025-08-31";

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
 * TAG_META: estilos e íconos por cada etiqueta visible (12).
 * Los pueblos se agregarán dinámicamente con un meta neutro.
 */
export const TAG_META: Record<string, TagMeta> = {
  circuitoMonteblanco: {
    label: "Circuito Monteblanco",
    icon: FlagIcon,
    color:
      "bg-indigo-50 text-indigo-600 dark:bg-white/5 dark:text-indigo-300",
  },
  donana: {
    label: "Doñana",
    icon: BugAntIcon,
    color:
      "bg-emerald-50 text-emerald-600 dark:bg-white/5 dark:text-emerald-300",
  },
  espaciosMuseisticos: {
    label: "Espacios museísticos",
    icon: BuildingLibraryIcon,
    color: "bg-sky-50 text-sky-600 dark:bg-white/5 dark:text-sky-300",
  },
  fiestasTradiciones: {
    label: "Fiestas y tradiciones",
    icon: SparklesIcon,
    color:
      "bg-fuchsia-50 text-fuchsia-600 dark:bg-white/5 dark:text-fuchsia-300",
  },
  laRabida: {
    label: "La Rábida",
    icon: BuildingOffice2Icon,
    color: "bg-rose-50 text-rose-600 dark:bg-white/5 dark:text-rose-300",
  },
  lugaresColombinos: {
    label: "Lugares colombinos",
    icon: MapIcon,
    color: "bg-teal-50 text-teal-600 dark:bg-white/5 dark:text-teal-300",
  },
  naturaleza: {
    label: "Naturaleza",
    icon: MapPinIcon,
    color:
      "bg-orange-50 text-orange-600 dark:bg-white/5 dark:text-orange-300",
  },
  patrimonio: {
    label: "Patrimonio",
    icon: HomeModernIcon,
    color:
      "bg-violet-50 text-violet-600 dark:bg-white/5 dark:text-violet-300",
  },
  playa: {
    label: "Playa",
    icon: SunIcon,
    color: "bg-blue-50 text-blue-600 dark:bg-white/5 dark:text-blue-300",
  },
  rutasCulturales: {
    label: "Rutas culturales",
    icon: MapIcon,
    color: "bg-amber-50 text-amber-600 dark:bg-white/5 dark:text-amber-300",
  },
  rutasSenderismo: {
    label: "Rutas senderismo y cicloturistas",
    icon: MapIcon,
    color: "bg-lime-50 text-lime-600 dark:bg-white/5 dark:text-lime-300",
  },
  sabor: {
    label: "Sabor",
    icon: ShoppingBagIcon,
    color: "bg-pink-50 text-pink-600 dark:bg-white/5 dark:text-pink-300",
  },
};

export const DEFAULT_TAG_META: TagMeta = {
  label: "Desconocido",
  icon: QuestionMarkCircleIcon,
  color: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
};

// ---------- Definición de etiquetas visibles y sus subtags (12) ----------
const VISIBLE_TAG_SPECS: Array<{ id: string; subtags: string[] }> = [
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
];

// ---------- PUEBLOS (18) ----------
const PUEBLOS = [
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
];

// ---------- Ponderadores ----------
/** Volumen por etiqueta visible (12) */
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
};

/** Volumen por pueblo (18) */
const PUEBLO_HINTS: Record<string, number> = {
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
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function dateRangeDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d0 = new Date(startISO + "T00:00:00Z");
  const d1 = new Date(endISO + "T00:00:00Z");
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// ---------- Helpers de pesos ----------
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

// ---------- Árbol lógico ----------
type Node =
  | { type: "tag"; id: string; subtags: string[] } // etiqueta visible con subtags (nivel 1 o 2 dentro de pueblo)
  | { type: "pueblo"; id: string }; // pueblo (nivel 1)

const VISIBLE_TAG_LOOKUP = Object.fromEntries(
  VISIBLE_TAG_SPECS.map((t) => [t.id, t.subtags])
);

/**
 * Construye la lista de nodos raíz:
 *  - etiquetas visibles (12)
 *  - pueblos (18)
 */
function buildRootNodes(): Node[] {
  const visible: Node[] = VISIBLE_TAG_SPECS.map(({ id, subtags }) => ({
    type: "tag",
    id,
    subtags,
  }));
  const pueblos: Node[] = PUEBLOS.map((id) => ({ type: "pueblo", id }));
  return [...visible, ...pueblos];
}

// ---------- Generación de series (soporta 1/2/3 niveles) ----------
function buildMockSeries(): SeriesDict {
  const dates = dateRangeDays(START, END);
  const series: SeriesDict = {};

  const maxTagItems = Math.max(1, ...Object.values(TAG_ITEM_HINTS));
  const maxPuebloItems = Math.max(1, ...Object.values(PUEBLO_HINTS));

  // Inicializa un contenedor para una clave de serie si no existe
  const ensureKey = (key: string) => {
    if (!series[key]) series[key] = {};
  };

  // Genera una serie base diaria para un "nodo" con un valor de popularidad y una semilla
  const buildDailyTotals = (
    popularity: number,
    maxRef: number,
    seedKey: string
  ): number[] => {
    const rnd = mulberry32(hashStr(seedKey));
    const baseMean = Math.round(80 + (popularity / maxRef) * (220 - 80));
    const amplitude = 0.35 + rnd() * 0.35; // 0.35–0.70
    const phase = rnd() * Math.PI * 2;

    return dates.map((date, idx) => {
      const season = Math.sin(idx / 18 + phase); // ciclo ~36 días
      const dow = new Date(date + "T00:00:00Z").getUTCDay(); // 0..6
      const weekendBoost = dow === 0 || dow === 6 ? 1.12 : 1.0;
      const noise = (rnd() - 0.5) * 0.18; // ±9%
      let total = baseMean * (1 + amplitude * season) * weekendBoost * (1 + noise);
      if (total < 0) total = 0;
      return total;
    });
  };

  // Reparto estable por subtags de una etiqueta visible
  const weightsForSubtags = (tagId: string, subtags: string[]) => {
    const rndFor = (s: string) => 0.6 + mulberry32(hashStr(`${tagId}.${s}:w`))() * 1.4; // 0.6–2.0
    const map: Record<string, number> = {};
    subtags.forEach((s) => (map[s] = rndFor(s)));
    return normalizeWeights(map);
  };

  // Reparto estable por etiquetas dentro de un pueblo (usa TAG_ITEM_HINTS)
  const weightsForTagsInTown = () => {
    const map: Record<string, number> = {};
    Object.entries(TAG_ITEM_HINTS).forEach(([tag, w]) => {
      map[tag] = Math.max(0.1, w); // evita ceros para “sabor”
    });
    return normalizeWeights(map);
  };

  const rootNodes = buildRootNodes();
  const tagWeightsInTown = weightsForTagsInTown();

  // 1) Etiquetas visibles como raíz (y sus subtags: nivel 1 y 2)
  for (const node of rootNodes) {
    if (node.type === "tag") {
      const { id: tag, subtags } = node;
      const totals = buildDailyTotals(TAG_ITEM_HINTS[tag] ?? 0, maxTagItems, `tag:${tag}`);
      const weights = weightsForSubtags(tag, subtags);

      ensureKey(tag);
      subtags.forEach((s) => ensureKey(`${tag}.${s}`));

      dates.forEach((date, i) => {
        let sum = 0;
        subtags.forEach((s) => {
          const r = mulberry32(hashStr(`${tag}.${s}:${date}`))();
          const jitter = 0.9 + r * 0.2;
          const val = Math.max(0, Math.round(totals[i] * weights[s] * jitter));
          series[`${tag}.${s}`][date] = val;
          sum += val;
        });
        series[tag][date] = sum;
      });
    }
  }

  // 2) Pueblos como raíz (nivel 1) -> etiquetas visibles (nivel 2) -> subtags (nivel 3)
  for (const node of rootNodes) {
    if (node.type === "pueblo") {
      const pueblo = node.id;

      const totalsTown = buildDailyTotals(
        PUEBLO_HINTS[pueblo] ?? 0,
        maxPuebloItems,
        `pueblo:${pueblo}`
      );

      // Clave del pueblo (nivel 1)
      ensureKey(pueblo);

      // Inicializa claves nivel 2/3
      Object.keys(VISIBLE_TAG_LOOKUP).forEach((tag) => {
        ensureKey(`${pueblo}.${tag}`);
        VISIBLE_TAG_LOOKUP[tag].forEach((s) => ensureKey(`${pueblo}.${tag}.${s}`));
      });

      const tagWeights = tagWeightsInTown;

      dates.forEach((date, i) => {
        // Repartir total del pueblo en etiquetas visibles
        let sumTown = 0;

        for (const [tag, w] of Object.entries(tagWeights)) {
          const tagTotalBase = totalsTown[i] * w;

          // Aplica un patrón propio por etiqueta dentro del pueblo (semilla estable)
          const rndTagTown = mulberry32(
            hashStr(`pueblo:${pueblo}:tag:${tag}`)
          );
          const factor = 0.9 + rndTagTown() * 0.2; // 0.9–1.1
          const tagTotal = Math.max(0, Math.round(tagTotalBase * factor));

          // Repartir a subtags como en el global del tag
          const subtags = VISIBLE_TAG_LOOKUP[tag] || [];
          const subWeights = weightsForSubtags(tag, subtags);

          let sumTag = 0;
          subtags.forEach((s) => {
            const r = mulberry32(hashStr(`pueblo:${pueblo}:${tag}.${s}:${date}`))();
            const jitter = 0.9 + r * 0.2;
            const val = Math.max(0, Math.round(tagTotal * subWeights[s] * jitter));
            series[`${pueblo}.${tag}.${s}`][date] = val;
            sumTag += val;
          });

          series[`${pueblo}.${tag}`][date] = sumTag;
          sumTown += sumTag;
        }

        series[pueblo][date] = sumTown;
      });
    }
  }

  return series;
}

// ---------- Export: SERIES quemado ----------
export const SERIES: SeriesDict = buildMockSeries();

/** Helpers opcionales */
export function getLastDate(series: SeriesDict = SERIES): string {
  let last = "";
  for (const [key, byDate] of Object.entries(series)) {
    // consideramos todas las claves
    for (const date of Object.keys(byDate)) {
      if (date > last) last = date;
    }
  }
  return last;
}

// ---------- Colores para chips/leyendas ----------
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

function metaToHex(meta: TagMeta): string {
  const token = meta.color.split(/\s+/).find((c) => c.startsWith("text-"));
  return (token && TAILWIND_TO_HEX[token]) || TAILWIND_TO_HEX["text-gray-600"];
}

/** Colores HEX por etiqueta visible (12) */
export const TAG_COLOR_HEX_BY_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(TAG_META).map(([tag, meta]) => [tag, metaToHex(meta)])
);

/** Colores HEX por etiqueta visible (por label) */
export const TAG_COLOR_HEX_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(TAG_META).map((meta) => [meta.label, metaToHex(meta)])
);

// ---------- Meta para pueblos (dinámico, si lo necesitas en UI) ----------
export const PUEBLO_META: Record<string, TagMeta> = Object.fromEntries(
  PUEBLOS.map((p) => [
    p,
    {
      label:
        p === "crucesMayoBonares"
          ? "Cruces de mayo de Bonares"
          : p === "puertasMurallaNiebla"
          ? "Puertas de la muralla de Niebla"
          : p
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (c) => c.toUpperCase())
              .trim(),
      icon: MapPinIcon,
      color: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200",
    },
  ])
);
