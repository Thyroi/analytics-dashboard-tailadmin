/**
 * Agregación de datos raw del chatbot para obtener totales por categoría y pueblo
 */

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";

// ===== Tipos de la API entrante =====
export type ApiPoint = { time: string; value: number };
export type ApiOutput = Record<string, ApiPoint[]>;
export type ApiRange = { start: string; end: string };
export type ApiMeta = {
  range: { current: ApiRange; previous: ApiRange };
  granularity: "d" | "w" | "m";
  timezone: string;
};
export type ApiResponse = { code: number; output: ApiOutput; meta: ApiMeta };

// ===== Tipos de salida =====
export type TotalsItem = {
  id: CategoryId | TownId;
  title: string;
  currentTotal: number;
  prevTotal: number;
};

export type TotalsResult = {
  categories: ReadonlyArray<TotalsItem>;
  towns: ReadonlyArray<TotalsItem>;
};

export type TotalsDebugRow = {
  key: string;
  segments: string[];
  townId?: TownId;
  categoryId?: CategoryId;
  addedCurrent: number;
  addedPrev: number;
};

export type TotalsOptions = {
  debug?: boolean;
  onDebugRow?: (row: TotalsDebugRow) => void;
};

// ===== Helpers =====
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, "");
}

function inRange(yyyymmdd: string, start: string, end: string): boolean {
  return yyyymmdd >= start && yyyymmdd <= end;
}

function buildCategorySynIndex(): Map<string, CategoryId> {
  const m = new Map<string, CategoryId>();
  for (const id of CATEGORY_ID_ORDER) {
    m.set(normalize(id), id);
    m.set(normalize(CATEGORY_META[id].label), id);
    for (const s of CATEGORY_SYNONYMS[id] ?? []) m.set(normalize(s), id);
  }
  // extras habituales vistos en datos
  m.set(normalize("rutas senderismo y cicloturistas"), "rutasSenderismo");
  m.set(normalize("espacios museisticos"), "espaciosMuseisticos");
  m.set(normalize("lugares colombinos"), "lugaresColombinos");
  m.set(normalize("la rabida"), "laRabida");
  m.set(normalize("la rábida"), "laRabida");
  m.set(normalize("circuito monteblanco"), "circuitoMonteblanco");
  m.set(normalize("doñana"), "donana");
  return m;
}

function buildTownSynIndex(): Map<string, TownId> {
  const m = new Map<string, TownId>();
  for (const id of TOWN_ID_ORDER) {
    m.set(normalize(id), id);
    m.set(normalize(TOWN_META[id].label), id);
  }
  // alias frecuentes
  m.set(normalize("la palma"), "laPalmaDelCondado");
  m.set(normalize("la palma del condado"), "laPalmaDelCondado");
  m.set(normalize("lucena"), "lucenaDelPuerto");
  m.set(normalize("paterna"), "paternaDelCampo");
  m.set(normalize("rociana"), "rocianaDelCondado");
  m.set(normalize("palos de la frontera"), "palos");
  return m;
}

/**
 * Divide la parte tras "root." en segmentos separados por "."
 * y, para cada segmento, si hay ">", se queda con el lado izquierdo.
 * Ej. "root.Rociana > Ruta del Vino.algo" -> ["Rociana", "Ruta del Vino", "algo"] (pero segmentados por ".", queda ["Rociana > Ruta del Vino","algo"] y luego se corta por ">")
 */
function splitSegmentsAfterRoot(rawKey: string): string[] {
  if (!rawKey.startsWith("root.")) return [];
  const after = rawKey.slice(5);
  const rawSegments = after.split(".");
  const segments: string[] = [];
  for (const seg of rawSegments) {
    const left = seg.includes(">") ? seg.split(">")[0] : seg;
    const trimmed = left.trim();
    if (trimmed.length > 0) segments.push(trimmed);
  }
  return segments;
}

/**
 * Detecta town y category en TODOS los segmentos (no solo el primero).
 * Devuelve el primer town que haga match y la primera categoría según orden canónico.
 */
function detectTownAndCategory(
  rawKey: string,
  townIndex: Map<string, TownId>,
  catIndex: Map<string, CategoryId>
): { townId?: TownId; categoryId?: CategoryId; segments: string[] } {
  const segments = splitSegmentsAfterRoot(rawKey);
  if (segments.length === 0) return { segments };

  const normSegs = segments.map((s) => normalize(s));
  const segSet = new Set(normSegs);

  // town: primer segmento que mapee
  let townId: TownId | undefined;
  for (const s of normSegs) {
    const hit = townIndex.get(s);
    if (hit) {
      townId = hit;
      break;
    }
  }

  // category: primera categoría en orden canónico que aparezca por id/label/sinónimos
  let categoryId: CategoryId | undefined;
  outer: for (const cat of CATEGORY_ID_ORDER) {
    if (
      segSet.has(normalize(cat)) ||
      segSet.has(normalize(CATEGORY_META[cat].label))
    ) {
      categoryId = cat;
      break;
    }
    const syns = CATEGORY_SYNONYMS[cat] ?? [];
    for (const syn of syns) {
      if (segSet.has(normalize(syn))) {
        categoryId = cat;
        break outer;
      }
    }
  }

  // fallback: usar índice global de sinónimos por si un segmento es un sinónimo no listado arriba
  if (!categoryId) {
    for (const s of normSegs) {
      const maybe = catIndex.get(s);
      if (maybe) {
        categoryId = maybe;
        break;
      }
    }
  }

  return { townId, categoryId, segments };
}

// ======= FUNCIÓN PRINCIPAL =======
export function computeCategoryAndTownTotals(
  api: ApiResponse,
  opts?: TotalsOptions
): TotalsResult {
  const { output, meta } = api;

  const currentStart = compactDate(meta.range.current.start); // YYYYMMDD
  const currentEnd = compactDate(meta.range.current.end);
  const prevStart = compactDate(meta.range.previous.start);
  const prevEnd = compactDate(meta.range.previous.end);

  const catIndex = buildCategorySynIndex();
  const townIndex = buildTownSynIndex();

  const catTotals: Record<CategoryId, { current: number; prev: number }> =
    Object.fromEntries(
      CATEGORY_ID_ORDER.map((id) => [id, { current: 0, prev: 0 }])
    ) as Record<CategoryId, { current: number; prev: number }>;

  const townTotals: Record<TownId, { current: number; prev: number }> =
    Object.fromEntries(
      TOWN_ID_ORDER.map((id) => [id, { current: 0, prev: 0 }])
    ) as Record<TownId, { current: number; prev: number }>;

  const debug = opts?.debug === true;
  const onDebugRow = opts?.onDebugRow;

  for (const rawKey of Object.keys(output)) {
    const { townId, categoryId, segments } = detectTownAndCategory(
      rawKey,
      townIndex,
      catIndex
    );
    if (!townId && !categoryId) {
      if (debug && onDebugRow) {
        onDebugRow({
          key: rawKey,
          segments,
          addedCurrent: 0,
          addedPrev: 0,
        });
      }
      continue;
    }

    let addCur = 0;
    let addPrev = 0;

    const series = output[rawKey]!;
    for (const pt of series) {
      const ymd = pt.time;
      const v = pt.value ?? 0;

      const isInCurrent = inRange(ymd, currentStart, currentEnd);
      const isInPrev = inRange(ymd, prevStart, prevEnd);

      if (isInCurrent) addCur += v;
      if (isInPrev) addPrev += v;
    }

    if (categoryId) {
      catTotals[categoryId].current += addCur;
      catTotals[categoryId].prev += addPrev;
    }
    if (townId) {
      townTotals[townId].current += addCur;
      townTotals[townId].prev += addPrev;
    }

    if (debug && onDebugRow) {
      onDebugRow({
        key: rawKey,
        segments,
        townId,
        categoryId,
        addedCurrent: addCur,
        addedPrev: addPrev,
      });
    }
  }

  const categories: TotalsItem[] = CATEGORY_ID_ORDER.map((id) => ({
    id,
    title: CATEGORY_META[id].label,
    currentTotal: catTotals[id].current,
    prevTotal: catTotals[id].prev,
  }));

  const towns: TotalsItem[] = TOWN_ID_ORDER.map((id) => ({
    id,
    title: TOWN_META[id].label,
    currentTotal: townTotals[id].current,
    prevTotal: townTotals[id].prev,
  }));

  return { categories, towns };
}

// ===== NUEVA FUNCIÓN PARA SERIES =====

export type SeriesPoint = { label: string; value: number };
export type SeriesData = {
  current: SeriesPoint[];
  previous: SeriesPoint[];
};

export type CategorySeriesItem = {
  id: CategoryId;
  title: string;
  series: SeriesData;
};

export type SeriesResult = {
  categories: ReadonlyArray<CategorySeriesItem>;
};

/**
 * Genera series temporales por categoría desde datos raw del chatbot
 */
export function computeCategorySeriesFromChatbot(
  apiResponse: ApiResponse,
  options: TotalsOptions = {}
): SeriesResult {
  const { debug = false, onDebugRow } = options;
  const { output, meta } = apiResponse;
  const { current: currentRange, previous: prevRange } = meta.range;

  // Crear índices como en la función original
  const townIndex = new Map<string, TownId>();
  for (const tid of TOWN_ID_ORDER) {
    townIndex.set(normalize(tid), tid);
    townIndex.set(normalize(TOWN_META[tid].label), tid);
  }

  const catIndex = new Map<string, CategoryId>();
  for (const cid of CATEGORY_ID_ORDER) {
    catIndex.set(normalize(cid), cid);
    catIndex.set(normalize(CATEGORY_META[cid].label), cid);
    const syns = CATEGORY_SYNONYMS[cid] ?? [];
    for (const syn of syns) {
      catIndex.set(normalize(syn), cid);
    }
  }

  // Inicializar estructuras para cada categoría
  const categorySeriesData = {} as Record<
    CategoryId,
    { current: Map<string, number>; previous: Map<string, number> }
  >;

  for (const categoryId of CATEGORY_ID_ORDER) {
    categorySeriesData[categoryId] = {
      current: new Map(),
      previous: new Map(),
    };
  }

  // Procesar cada key del output
  for (const [rawKey, series] of Object.entries(output)) {
    const { categoryId, segments } = detectTownAndCategory(
      rawKey,
      townIndex,
      catIndex
    );

    if (!categoryId) {
      if (debug && onDebugRow) {
        onDebugRow({
          key: rawKey,
          segments,
          categoryId: undefined,
          townId: undefined,
          addedCurrent: 0,
          addedPrev: 0,
        });
      }
      continue;
    }

    // Procesar cada punto temporal
    for (const pt of series) {
      const ymd = pt.time; // formato YYYY-MM-DD
      const value = pt.value ?? 0;

      const isInCurrent = inRange(ymd, currentRange.start, currentRange.end);
      const isInPrev = inRange(ymd, prevRange.start, prevRange.end);

      if (isInCurrent) {
        const currentValue =
          categorySeriesData[categoryId].current.get(ymd) || 0;
        categorySeriesData[categoryId].current.set(ymd, currentValue + value);
      }

      if (isInPrev) {
        const prevValue = categorySeriesData[categoryId].previous.get(ymd) || 0;
        categorySeriesData[categoryId].previous.set(ymd, prevValue + value);
      }
    }
  }

  // Convertir Maps a arrays ordenados
  const categories: CategorySeriesItem[] = CATEGORY_ID_ORDER.map((id) => {
    const currentMap = categorySeriesData[id].current;
    const previousMap = categorySeriesData[id].previous;

    // Obtener todas las fechas únicas y ordenarlas
    const currentDates = Array.from(currentMap.keys()).sort();
    const previousDates = Array.from(previousMap.keys()).sort();

    const currentSeries: SeriesPoint[] = currentDates.map((date) => ({
      label: date,
      value: currentMap.get(date) || 0,
    }));

    const previousSeries: SeriesPoint[] = previousDates.map((date) => ({
      label: date,
      value: previousMap.get(date) || 0,
    }));

    return {
      id,
      title: CATEGORY_META[id].label,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
    };
  });

  return { categories };
}
