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
export type Urls = {
  /** Página interna de resumen/listado del tag o pueblo */
  overview: string;
  /** Ruta del mapa con filtros aplicados */
  map?: string;
  /** Ruta alternativa (listado, colección específica) */
  list?: string;
  /** Ejemplo de recurso externo (oficial) */
  external?: string;
};

export type TagMeta = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; // tailwind classes para el “chip”
  urls?: Urls;   // <- NUEVO
};

/** Helpers URL */
const slug = (s: string) =>
  s
    .replace(/([A-Z])/g, "-$1")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const urlForTag = (tagId: string): Urls => ({
  overview: `/explorar/${slug(tagId)}`,
  list: `/explorar/${slug(tagId)}/listado`,
  map: `/mapa?tag=${encodeURIComponent(tagId)}`,
});

const urlForPueblo = (puebloId: string): Urls => ({
  overview: `/municipio/${slug(puebloId)}`,
  list: `/municipio/${slug(puebloId)}/experiencias`,
  map: `/mapa?pueblo=${encodeURIComponent(puebloId)}`,
});

// ---------- Definición de etiquetas visibles y sus subtags (12) ----------
export const VISIBLE_TAG_SPECS: Array<{ id: string; subtags: string[] }> = [
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

// ---------- TAG_META con URLs ----------
export const TAG_META: Record<string, TagMeta> = {
  circuitoMonteblanco: {
    label: "Circuito Monteblanco",
    icon: FlagIcon,
    color: "bg-indigo-50 text-indigo-600 dark:bg-white/5 dark:text-indigo-300",
    urls: { ...urlForTag("circuitoMonteblanco"), external: "https://www.circuitomonteblanco.com/" },
  },
  donana: {
    label: "Doñana",
    icon: BugAntIcon,
    color: "bg-emerald-50 text-emerald-600 dark:bg-white/5 dark:text-emerald-300",
    urls: { ...urlForTag("donana"), external: "https://www.donana.es/" },
  },
  espaciosMuseisticos: {
    label: "Espacios museísticos",
    icon: BuildingLibraryIcon,
    color: "bg-sky-50 text-sky-600 dark:bg-white/5 dark:text-sky-300",
    urls: urlForTag("espaciosMuseisticos"),
  },
  fiestasTradiciones: {
    label: "Fiestas y tradiciones",
    icon: SparklesIcon,
    color: "bg-fuchsia-50 text-fuchsia-600 dark:bg-white/5 dark:text-fuchsia-300",
    urls: urlForTag("fiestasTradiciones"),
  },
  laRabida: {
    label: "La Rábida",
    icon: BuildingOffice2Icon,
    color: "bg-rose-50 text-rose-600 dark:bg-white/5 dark:text-rose-300",
    urls: urlForTag("laRabida"),
  },
  lugaresColombinos: {
    label: "Lugares colombinos",
    icon: MapIcon,
    color: "bg-teal-50 text-teal-600 dark:bg-white/5 dark:text-teal-300",
    urls: urlForTag("lugaresColombinos"),
  },
  naturaleza: {
    label: "Naturaleza",
    icon: MapPinIcon,
    color: "bg-orange-50 text-orange-600 dark:bg-white/5 dark:text-orange-300",
    urls: urlForTag("naturaleza"),
  },
  patrimonio: {
    label: "Patrimonio",
    icon: HomeModernIcon,
    color: "bg-violet-50 text-violet-600 dark:bg-white/5 dark:text-violet-300",
    urls: urlForTag("patrimonio"),
  },
  playa: {
    label: "Playa",
    icon: SunIcon,
    color: "bg-blue-50 text-blue-600 dark:bg-white/5 dark:text-blue-300",
    urls: urlForTag("playa"),
  },
  rutasCulturales: {
    label: "Rutas culturales",
    icon: MapIcon,
    color: "bg-amber-50 text-amber-600 dark:bg-white/5 dark:text-amber-300",
    urls: urlForTag("rutasCulturales"),
  },
  rutasSenderismo: {
    label: "Rutas senderismo y cicloturistas",
    icon: MapIcon,
    color: "bg-lime-50 text-lime-600 dark:bg-white/5 dark:text-lime-300",
    urls: urlForTag("rutasSenderismo"),
  },
  sabor: {
    label: "Sabor",
    icon: ShoppingBagIcon,
    color: "bg-pink-50 text-pink-600 dark:bg-white/5 dark:text-pink-300",
    urls: urlForTag("sabor"),
  },
};

export const DEFAULT_TAG_META: TagMeta = {
  label: "Desconocido",
  icon: QuestionMarkCircleIcon,
  color: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
};

// ---------- PUEBLOS (18) ----------
export const PUEBLOS = [
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
  const datesArr = dateRangeDays(START, END);

  // 1) Etiquetas visibles como raíz (y sus subtags: nivel 1 y 2)
  for (const node of rootNodes) {
    if (node.type === "tag") {
      const { id: tag, subtags } = node;
      const totals = buildDailyTotals(TAG_ITEM_HINTS[tag] ?? 0, maxTagItems, `tag:${tag}`);
      const weights = weightsForSubtags(tag, subtags);

      ensureKey(tag);
      subtags.forEach((s) => ensureKey(`${tag}.${s}`));

      datesArr.forEach((date, i) => {
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

      datesArr.forEach((date, i) => {
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
  for (const [, byDate] of Object.entries(series)) {
    for (const date of Object.keys(byDate)) {
      if (date > last) last = date;
    }
  }
  return last;
}

// ---------- Totales y rangos ----------
const allDates = dateRangeDays(START, END);
const dateIndex: Record<string, number> = Object.fromEntries(
  allDates.map((d, i) => [d, i])
);

export function getTotalForKey(key: string, dict: SeriesDict = SERIES): number {
  const row = dict[key] || {};
  let sum = 0;
  for (const v of Object.values(row)) sum += v;
  return sum;
}

export function getTotalForKeyInRange(
  key: string,
  startISO: string,
  endISO: string,
  dict: SeriesDict = SERIES
): number {
  const row = dict[key] || {};
  let sum = 0;
  for (const [d, v] of Object.entries(row)) {
    if (d >= startISO && d <= endISO) sum += v;
  }
  return sum;
}

export function getLastNDaysSlice(n = 30): { start: string; end: string; dates: string[] } {
  const end = allDates[allDates.length - 1];
  const startIdx = Math.max(0, allDates.length - n);
  const start = allDates[startIdx];
  return { start, end, dates: allDates.slice(startIdx) };
}

export function getSeriesArrayForKeyInRange(
  key: string,
  startISO: string,
  endISO: string,
  dict: SeriesDict = SERIES
): number[] {
  const row = dict[key] || {};
  const dates = dateRangeDays(startISO, endISO);
  return dates.map((d) => row[d] ?? 0);
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

// ---------- Meta para pueblos (dinámico, + URLs) ----------
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
      urls: urlForPueblo(p),
    },
  ])
);

// ======================================================
//           RESÚMENES: TAG -> PUEBLOS
// ======================================================

export type TownSubtagBreakdown = {
  id: string;
  label: string;
  total: number;
  pct: number; // porcentaje dentro del tag de ese pueblo
};

export type TownSummary = {
  pueblo: string;
  label: string;
  urls: Urls;
  /** Total del tag en el pueblo para todo el rango (START..END) */
  total: number;
  /** Total de los últimos N días (por defecto 30) */
  lastNDays: number;
  /** Serie diaria de los últimos N días (para sparklines) */
  trend: number[];
  /** Top subtags por contribución */
  topSubtags: TownSubtagBreakdown[];
};

function buildTownSummaryForTag(
  tagId: string,
  puebloId: string,
  nDays = 30,
  dict: SeriesDict = SERIES
): TownSummary {
  const tagKeyTown = `${puebloId}.${tagId}`;
  const total = getTotalForKey(tagKeyTown, dict);

  const { start, end, dates } = getLastNDaysSlice(nDays);
  const lastNDays = getTotalForKeyInRange(tagKeyTown, start, end, dict);
  const trend = getSeriesArrayForKeyInRange(tagKeyTown, start, end, dict);

  const subtags = VISIBLE_TAG_LOOKUP[tagId] || [];
  const breakdown: TownSubtagBreakdown[] = subtags.map((s) => {
    const k = `${puebloId}.${tagId}.${s}`;
    const tot = getTotalForKeyInRange(k, START, END, dict);
    const pct = total > 0 ? Math.round((tot * 10000) / total) / 100 : 0;
    return { id: s, label: s, total: tot, pct };
  });

  breakdown.sort((a, b) => b.total - a.total);

  const pm = PUEBLO_META[puebloId];

  return {
    pueblo: puebloId,
    label: pm?.label ?? puebloId,
    urls: pm?.urls ?? urlForPueblo(puebloId),
    total,
    lastNDays,
    trend,
    topSubtags: breakdown.slice(0, 5),
  };
}

/**
 * Mapa TAG -> Array de resúmenes por pueblo (ordenado desc por total)
 * Este objeto es estático con base al mock generado.
 */
export const RESUMEN_POR_TAG: Record<string, TownSummary[]> = (() => {
  const out: Record<string, TownSummary[]> = {};
  for (const { id: tagId } of VISIBLE_TAG_SPECS) {
    const rows = PUEBLOS.map((p) => buildTownSummaryForTag(tagId, p));
    rows.sort((a, b) => b.total - a.total);
    out[tagId] = rows;
  }
  return out;
})();

/** Helper para obtener (o recalcular) resúmenes por tag con opciones */
export function getTownSummariesForTag(
  tagId: string,
  opts?: { days?: number; dict?: SeriesDict }
): TownSummary[] {
  const n = opts?.days ?? 30;
  const d = opts?.dict ?? SERIES;
  const rows = PUEBLOS.map((p) => buildTownSummaryForTag(tagId, p, n, d));
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

