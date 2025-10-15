// src/lib/mindsaic/mockGenerator.ts
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER } from "@/lib/taxonomy/towns";

/* =================== Tipos público/IO =================== */
export type MindsaicGranularity = "d" | "w" | "m" | "y";
export type MindsaicInput = {
  db: string;
  pattern: string;
  granularity: MindsaicGranularity;
  startTime?: string; // formato depende de granularity
  endTime?: string; // idem
};
export type MindsaicPoint = { time: string; value: number };
export type MindsaicOutput = {
  code: number;
  output: Record<string, MindsaicPoint[]>;
};

/* =================== Config =================== */
const PROJECT_START_ISO = "2025-09-01";

// Rangos por granularidad (totales de la categoría para ese bucket)
const LIMITS = {
  d: { min: 12, max: 17 }, // día: ~15 máximo aprox
  w: { min: 50, max: 80 }, // semana: 50–80
  m: { min: 200, max: 500 }, // mes: 200–500
  y: { min: 500, max: 1200 }, // año: 500–1200
} as const;

// Sub-actividades por categoría (se pueden tocar a gusto)
const SUBS_BY_CATEGORY: Partial<Record<CategoryId, string[]>> = {
  playas: ["limpieza", "banderas", "marea", "servicios"],
  naturaleza: ["rutas", "fauna", "flora", "miradores"],
  rutasCulturales: ["itinerarios", "horarios", "entradas"],
  rutasSenderismo: ["tramos", "dificultad", "alquiler-bici"],
  espaciosMuseisticos: ["exposiciones", "entradas", "horarios"],
  patrimonio: ["monumentos", "visitas", "restauracion"],
  sabor: ["restauracion", "productos", "bodegas"],
  donana: ["senderos", "centros-visita", "avistamiento"],
  circuitoMonteblanco: ["eventos", "cursos", "precios"],
  laRabida: ["conventos", "museo", "barcos"],
  lugaresColombinos: ["museos", "rutas", "actos"],
  fiestasTradiciones: ["romerias", "ferias", "procesiones"],
};

/* =================== Utils fecha =================== */
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}
function clampRange(startISO: string, endISO: string) {
  const min = parseISO(PROJECT_START_ISO);
  const today = toISO(new Date());
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const S = s < min ? min : s;
  const E = toISO(e > parseISO(today) ? parseISO(today) : e);
  return { startISO: toISO(S), endISO: E };
}

/* =================== Semana/mes/año keys =================== */
// Semana ISO (aprox)
function isoWeekKey(iso: string): string {
  const d = parseISO(iso);
  const tmp = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}/${String(week).padStart(2, "0")}`;
}
function monthKey(iso: string): string {
  return `${iso.slice(0, 4)}/${iso.slice(5, 7)}`;
}
// function yearKey(iso: string): string { return iso.slice(0, 4); } // TEMPORALMENTE NO USADO

/* =================== Listado de buckets por granularidad =================== */
function enumerateBuckets(
  startISO: string,
  endISO: string,
  g: MindsaicGranularity
): string[] {
  const out: string[] = [];
  if (g === "d") {
    for (
      let cur = parseISO(startISO);
      cur <= parseISO(endISO);
      cur = addDays(cur, 1)
    ) {
      out.push(toISO(cur)); // luego se formatea a YYYYMMDD
    }
    return out;
  }

  if (g === "w") {
    // avanzamos por días pero deduplicamos en semana
    const seen = new Set<string>();
    for (
      let cur = parseISO(startISO);
      cur <= parseISO(endISO);
      cur = addDays(cur, 1)
    ) {
      const wk = isoWeekKey(toISO(cur));
      if (!seen.has(wk)) {
        seen.add(wk);
        out.push(wk);
      }
    }
    return out;
  }

  if (g === "m") {
    // primer día de cada mes
    const s = parseISO(startISO);
    const e = parseISO(endISO);
    let cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
    const end = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1));
    while (cur <= end) {
      out.push(monthKey(toISO(cur)));
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    }
    return out;
  }

  // y
  const sY = Number(startISO.slice(0, 4));
  const eY = Number(endISO.slice(0, 4));
  for (let y = sY; y <= eY; y++) out.push(String(y));
  return out;
}

function timeKeyForAPI(iso: string, g: MindsaicGranularity): string {
  if (g === "d") return iso.replaceAll("-", ""); // YYYYMMDD
  if (g === "w") return iso; // YYYY/WW
  if (g === "m") return iso; // YYYY/MM
  return iso; // YYYY
}

/* =================== RNG determinístico =================== */
function hash32(s: string): number {
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
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rnd: () => number, min: number, max: number): number {
  return Math.floor(min + rnd() * (max - min + 1));
}

/** reparte un entero `total` en `n` partes (enteras), permitiendo ceros, determinístico por semilla */
function splitIntegerDeterministic(
  total: number,
  n: number,
  seed: string
): number[] {
  if (n <= 0) return [];
  if (total <= 0) return Array(n).fill(0);

  const rnd = mulberry32(hash32(seed));
  // generamos pesos aleatorios (incluidos ceros)
  const weights = Array.from({ length: n }, () => rnd());
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sumW) * total);

  // convertir a enteros asegurando suma == total
  const ints = raw.map(Math.floor);
  const rest = total - ints.reduce((a, b) => a + b, 0);
  // asignamos el resto a las mayores fracciones
  const idxByFrac = raw
    .map((x, i) => [x - Math.floor(x), i] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
  for (let k = 0; k < rest; k++) ints[idxByFrac[k % n]]++;

  return ints;
}

/* =================== Pattern filter =================== */
function patternToRegExp(pattern: string): RegExp {
  const esc = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + esc + "$", "i");
}

/* =================== Parsing de rango según granularity =================== */
function deriveRangeFromQuery(
  g: MindsaicGranularity,
  startTime?: string,
  endTime?: string
): { startISO: string; endISO: string } {
  if (!startTime && !endTime) {
    const today = toISO(new Date());
    return clampRange(PROJECT_START_ISO, today);
  }

  if (g === "d") {
    const s = startTime
      ? `${startTime.slice(0, 4)}-${startTime.slice(4, 6)}-${startTime.slice(
          6,
          8
        )}`
      : PROJECT_START_ISO;
    const e = endTime
      ? `${endTime.slice(0, 4)}-${endTime.slice(4, 6)}-${endTime.slice(6, 8)}`
      : toISO(new Date());
    return clampRange(s, e);
  }

  if (g === "w") {
    // aproximamos: de la semana de `startTime` al final de la semana de `endTime`
    const s = startTime ? startTime.split("/") : undefined;
    const e = endTime ? endTime.split("/") : undefined;
    const sISO = s ? `${s[0]}-01-01` : PROJECT_START_ISO;
    const eISO = e ? `${e[0]}-12-31` : toISO(new Date());
    return clampRange(sISO, eISO);
  }

  if (g === "m") {
    const sISO = startTime
      ? `${startTime.replace("/", "-")}-01`
      : PROJECT_START_ISO;
    const eISO = endTime
      ? toISO(endOfMonth(parseISO(`${endTime.replace("/", "-")}-01`)))
      : toISO(new Date());
    return clampRange(sISO, eISO);
  }

  // y
  const sISO = startTime ? `${startTime}-01-01` : PROJECT_START_ISO;
  const eISO = endTime ? `${endTime}-12-31` : toISO(new Date());
  return clampRange(sISO, eISO);
}

/* =================== Generación principal =================== */
/**
 * Para cada bucket temporal:
 *  1) Elige un total por categoría dentro del rango por granularidad (LIMITS[g])
 *  2) Reparte ese total entre pueblos (ceros permitidos)
 *  3) Para cada pueblo con >0, reparte entre subcategorías
 *  4) Construye series por tag: root.<town>.<category>.<sub>
 */
export function generateMockResponse(input: MindsaicInput): MindsaicOutput {
  const { pattern, granularity: g, startTime, endTime } = input;

  const { startISO, endISO } = deriveRangeFromQuery(g, startTime, endTime);
  const buckets = enumerateBuckets(startISO, endISO, g);
  const limits = LIMITS[g];

  const allTagsSeries = new Map<string, MindsaicPoint[]>();

  for (const bucket of buckets) {
    // total por categoría (p.ej. NATURALEZA día 12–17, semana 50–80, etc.)
    for (const cat of CATEGORY_ID_ORDER) {
      const seedCat = `CAT|${cat}|${bucket}|${g}`;
      const rndCat = mulberry32(hash32(seedCat));
      const catTotal = randInt(rndCat, limits.min, limits.max);

      // Repartimos entre pueblos
      const townsSplit = splitIntegerDeterministic(
        catTotal,
        TOWN_ID_ORDER.length,
        `TWNS|${cat}|${bucket}|${g}`
      );

      TOWN_ID_ORDER.forEach((town, ti) => {
        const townTotal = townsSplit[ti];
        if (townTotal <= 0) return;

        const subs = SUBS_BY_CATEGORY[cat] ?? ["general"];
        const subsSplit = splitIntegerDeterministic(
          townTotal,
          subs.length,
          `SUBS|${town}|${cat}|${bucket}|${g}`
        );

        subs.forEach((sub, si) => {
          const v = subsSplit[si];
          if (v <= 0) return;

          const tag = `root.${town}.${cat}.${sub}`;
          const timeKey = timeKeyForAPI(
            g === "d" ? bucket.replaceAll("-", "") : bucket,
            g
          );

          const arr = allTagsSeries.get(tag) ?? [];
          arr.push({ time: timeKey, value: v });
          allTagsSeries.set(tag, arr);
        });
      });
    }
  }

  // Filtrado por pattern (wildcards)
  const re = patternToRegExp(pattern);
  const output: Record<string, MindsaicPoint[]> = {};
  for (const [tag, series] of allTagsSeries.entries()) {
    if (re.test(tag)) {
      // compactar y ordenar por clave de tiempo (por si acaso)
      const sorted = [...series].sort((a, b) =>
        a.time < b.time ? -1 : a.time > b.time ? 1 : 0
      );
      output[tag] = sorted;
    }
  }

  return { code: 200, output };
}
