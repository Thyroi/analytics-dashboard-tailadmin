/**
 * Servicio para obtener breakdown de subcategorías dentro de un town+categoría
 *
 * NIVEL 2: Town+Categoría → Subcategorías
 *
 * Reglas:
 * - Pattern: "root.<townId>.<categoryId>.*" (town + categoría específica)
 * - Filtro: profundidad === 4 (root.<town>.<cat>.<subcat>)
 * - POST dual: current + previous con granularity="d"
 * - Subcategorías: texto crudo normalizado (trim, espacios, preservar acentos)
 * - Renderizar todas las subcategorías encontradas (vacío si no hay)
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 * - Series para comparativa: si windowGranularity==='y' → agrupar YYYY-MM (máx 12 buckets)
 *
 * NUEVO: Soporte para othersOnly (navegar "Otros" de nivel 1)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  getCategorySearchPattern,
  getTownSearchPattern,
} from "@/lib/taxonomy/patterns";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { bucketize } from "./bucketizer";
import {
  collectUniverseForView,
  type UniverseRecord,
  type ViewParams,
} from "./universeCollector";

/* ==================== Debug Flag ==================== */
const DEBUG_LEVEL2 = false; // Cambiar a true para logging detallado

/* ==================== Helpers ==================== */

/**
 * Normaliza texto para la API: lowercase, sin acentos EXCEPTO ñ
 */
function normalizeForAPI(input: string): string {
  if (!input) return "";
  // Lowercase
  let s = input.toLowerCase();
  // Preservar ñ temporalmente
  s = s.replace(/ñ/g, "[[ENYE]]");
  // Quitar acentos
  s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Restaurar ñ
  s = s.replace(/\[\[ENYE\]\]/g, "ñ");
  // Normalizar espacios
  s = s.replace(/[ _-]+/g, " ");
  s = s.replace(/\s+/g, " ");
  s = s.trim();
  return s;
}

/* ==================== Tipos ==================== */

export type TownCategorySubcatData = {
  subcategoryName: string; // Texto crudo normalizado
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
  series?: Array<{ time: string; value: number }>; // Series para comparativa
};

export type TownCategorySubcatBreakdownResponse = {
  townId: TownId;
  categoryId: CategoryId;
  subcategories: TownCategorySubcatData[];
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
    /** Indica si es una vista de "Otros" (claves no mapeadas del nivel 1) */
    source: {
      othersOnly: boolean;
    };
  };
  /** Opcional: respuestas crudas y request para depuración */
  raw?: {
    current: Record<string, Array<{ time: string; value: number }>>;
    previous: Record<string, Array<{ time: string; value: number }>>;
    request: {
      pattern: string;
      granularity: string;
      startTimeCurrent: string;
      endTimeCurrent: string;
      startTimePrevious: string;
      endTimePrevious: string;
      db: string;
    };
  };
};

export type FetchTownCategorySubcatBreakdownParams = {
  townId: TownId;
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  /** Optional: representative raw segment token (from L1) to query instead of canonical categoryId */
  representativeRawSegment?: string | null;
  /** Si true, solo mostrar claves que NO mapearon en nivel 1 (navegación desde "Otros") */
  othersOnly?: boolean;
};

/* ==================== Helpers ==================== */

/**
 * Normaliza el nombre de subcategoría:
 * - trim
 * - colapsar múltiples espacios a uno solo
 * - preservar acentos
 * - lowercase para agrupación
 */
function normalizeSubcategoryName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ") // colapsar espacios
    .toLowerCase();
}

/**
 * Filtra solo claves con profundidad 4: root.<town>.<cat>.<subcat>
 */
// Función legacy - mantener por si es necesaria en el futuro
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseSubcategories(
  data: Record<string, Array<{ time: string; value: number }>>,
  opts: {
    townToken: string;
    townWildcard: boolean;
    categoryToken: string;
    categoryWildcard: boolean;
  }
): Map<string, Array<{ time: string; value: number }>> {
  const result = new Map<string, Array<{ time: string; value: number }>>();

  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const matchSeg = (keySeg: string, token: string, wildcard: boolean) => {
    const ks = norm(keySeg);
    const tk = norm(token);
    return wildcard ? ks.startsWith(tk) : ks === tk;
  };

  for (const [key, series] of Object.entries(data)) {
    const parts = key.split(".");
    if (parts.length !== 4) continue; // Solo profundidad 4
    if (parts[0] !== "root") continue;
    if (!matchSeg(parts[1], opts.townToken, opts.townWildcard)) continue;
    if (!matchSeg(parts[2], opts.categoryToken, opts.categoryWildcard))
      continue;

    const rawSubcat = parts[3];
    if (!rawSubcat || rawSubcat === "") continue;

    const normalizedSubcat = normalizeSubcategoryName(rawSubcat);

    // Acumular series si la subcategoría normalizada ya existe
    const existing = result.get(normalizedSubcat) || [];
    result.set(normalizedSubcat, [...existing, ...series]);
  }

  return result;
}

/**
 * Suma totales de una serie de datos
 */
// Función legacy - mantener por si es necesaria en el futuro
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sumSeries(series: Array<{ time: string; value: number }>): number {
  return series.reduce((sum, point) => sum + point.value, 0);
}

/**
 * Calcula delta porcentual (null si prev <= 0)
 */
function computeDeltaPercent(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}

/**
 * Agrupa series por YYYY-MM (máximo 12 buckets para granularidad anual)
 */
// Función legacy - mantener por si es necesaria en el futuro
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function groupSeriesByMonth(
  series: Array<{ time: string; value: number }>
): Array<{ time: string; value: number }> {
  const monthMap = new Map<string, number>();

  for (const point of series) {
    // time formato: YYYYMMDD → extraer YYYY-MM
    const yearMonth = `${point.time.slice(0, 4)}-${point.time.slice(4, 6)}`;
    const current = monthMap.get(yearMonth) || 0;
    monthMap.set(yearMonth, current + point.value);
  }

  // Convertir a array y ordenar
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, value]) => ({ time, value }));
}

/**
 * Fetch de datos de Mindsaic con timeout
 */
async function fetchMindsaicData(
  pattern: string,
  granularity: string,
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<Record<string, Array<{ time: string; value: number }>>> {
  const payload = {
    patterns: pattern, // ✅ API espera "patterns" no "pattern"
    granularity,
    startTime,
    endTime,
    db,
  };

  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Mindsaic API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  // API puede devolver {output} o {data}; soportar ambas formas
  const output: Record<
    string,
    Array<{ time: string; value: number }>
  > = (json && (json.output || json.data)) || {};
  return output;
}

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de subcategorías para un town+categoría específico
 * REFACTORIZADO: Usa collectUniverseForView para universo unificado entre donut y series
 */
export async function fetchTownCategorySubcatBreakdown({
  townId,
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
  representativeRawSegment = null,
  othersOnly = false,
}: FetchTownCategorySubcatBreakdownParams): Promise<TownCategorySubcatBreakdownResponse> {
  // 1. Calcular rangos
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // 3. Determinar tokens y wildcard para town y categoría
    const townPat = getTownSearchPattern(townId);

    // Para categoría: si tenemos representativeRawSegment, usar la lógica de getCategorySearchPattern
    let catPat: { token: string; wildcard: boolean };
    if (representativeRawSegment) {
      // Normalizar y extraer primera palabra
      const normalizedToken = normalizeForAPI(representativeRawSegment);
      const words = normalizedToken.split(/\s+/).filter((w) => w.length > 0);
      const firstWord = words[0];

      // Si tiene múltiples palabras, usar wildcard genérico
      catPat = {
        token: firstWord,
        wildcard: words.length > 1, // Automático: más de 1 palabra = wildcard
      };
    } else {
      catPat = getCategorySearchPattern(categoryId);
    }

    // Normalizar tokens para la API (sin acentos EXCEPTO ñ, lowercase, pero CON espacios)
    const normalizedTownToken = normalizeForAPI(townPat.token);
    const normalizedCatToken = normalizeForAPI(catPat.token);

    // Construir pattern con wildcard selectivo (con ESPACIOS alrededor del *)
    const townPart = townPat.wildcard
      ? `${normalizedTownToken} *`
      : normalizedTownToken;
    const catPart = catPat.wildcard
      ? `${normalizedCatToken} *`
      : normalizedCatToken;
    const pattern = `root.${townPart}.${catPart}.*`;

    // 4. POST dual (current + previous) con granularity="d"
    const startTimeCurrent = ranges.current.start.replace(/-/g, "");
    const endTimeCurrent = ranges.current.end.replace(/-/g, "");
    const startTimePrevious = ranges.previous.start.replace(/-/g, "");
    const endTimePrevious = ranges.previous.end.replace(/-/g, "");

    const [currentData, previousData] = await Promise.all([
      fetchMindsaicData(
        pattern,
        "d", // Siempre "d" para Mindsaic
        startTimeCurrent, // YYYYMMDD
        endTimeCurrent,
        db,
        controller.signal
      ),
      fetchMindsaicData(
        pattern,
        "d",
        startTimePrevious,
        endTimePrevious,
        db,
        controller.signal
      ),
    ]);

    // 5. NUEVO: Usar collectUniverseForView para universo unificado
    const viewParams: ViewParams = {
      level: othersOnly ? 1 : 2, // Si othersOnly, filtrar nivel 1 (depth=3) para obtener no-mapeados
      categoryId,
      townId,
      othersOnly,
      granularity: windowGranularity,
      range: ranges,
      navigationType: "town-first",
    };

    const currentRecords = collectUniverseForView(currentData, viewParams);
    const previousRecords = collectUniverseForView(previousData, viewParams);

    // 6. Agrupar por subcategoría (último token de la clave)
    const groupRecordsBySubcat = (records: UniverseRecord[]) => {
      const grouped = new Map<string, UniverseRecord[]>();
      for (const record of records) {
        // Último token = subcategoría
        const lastToken = record.keyInfo.parts[record.keyInfo.parts.length - 1];
        const subcatName = normalizeSubcategoryName(lastToken || "unknown");

        const existing = grouped.get(subcatName) || [];
        existing.push(record);
        grouped.set(subcatName, existing);
      }
      return grouped;
    };

    const currentBySubcat = groupRecordsBySubcat(currentRecords);
    const previousBySubcat = groupRecordsBySubcat(previousRecords);

    // 7. Obtener todas las subcategorías únicas
    const allSubcatNames = new Set<string>([
      ...currentBySubcat.keys(),
      ...previousBySubcat.keys(),
    ]);

    // 8. Construir lista de subcategorías con totales y deltas
    const subcategories: TownCategorySubcatData[] = Array.from(allSubcatNames)
      .map((subcatName) => {
        const currentRecs = currentBySubcat.get(subcatName) || [];
        const prevRecs = previousBySubcat.get(subcatName) || [];

        const currentTotal = currentRecs.reduce((sum, r) => sum + r.value, 0);
        const prevTotal = prevRecs.reduce((sum, r) => sum + r.value, 0);
        const deltaAbs = currentTotal - prevTotal;
        const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

        // Series para comparativa: bucketizar
        const bucketized = bucketize(
          currentRecs,
          prevRecs,
          windowGranularity,
          ranges.current
        );

        // Convertir a formato legado (Array<{time, value}>)
        const series = bucketized.xLabels.map((label: string, i: number) => ({
          time: label,
          value: bucketized.current[i],
        }));

        return {
          subcategoryName: subcatName,
          currentTotal,
          prevTotal,
          deltaAbs,
          deltaPercent,
          series,
        };
      })
      .sort((a, b) => b.currentTotal - a.currentTotal); // Ordenar por total descendente

    if (DEBUG_LEVEL2) {
      console.log(
        `[fetchTownCategorySubcatBreakdown] Subcategories found: ${subcategories.length}`
      );
      console.log(
        `[fetchTownCategorySubcatBreakdown] Top 5:`,
        subcategories
          .slice(0, 5)
          .map((s) => `${s.subcategoryName}=${s.currentTotal}`)
      );
    }

    // 9. Metadata
    return {
      townId,
      categoryId,
      subcategories,
      meta: {
        granularity: windowGranularity,
        timezone: "UTC",
        range: {
          current: {
            start: ranges.current.start,
            end: ranges.current.end,
          },
          previous: {
            start: ranges.previous.start,
            end: ranges.previous.end,
          },
        },
        source: {
          othersOnly,
        },
      },
      raw: {
        current: currentData,
        previous: previousData,
        request: {
          pattern,
          granularity: "d",
          startTimeCurrent,
          endTimeCurrent,
          startTimePrevious,
          endTimePrevious,
          db,
        },
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
