/**
 * Servicio para obtener breakdown de subcategorías dentro de categoría+town
 *
 * NIVEL 2: Categoría+Town → Subcategorías (category-first)
 *
 * Reglas:
 * - Pattern: "root.<categoriaRaw>.<townRaw>.*" (categoría + town específico)
 * - Filtro: profundidad === 4 (root.<categoria>.<town>.<subcat>)
 * - POST dual: current + previous con granularity="d"
 * - Subcategorías: texto crudo normalizado (trim, espacios, preservar acentos)
 * - Renderizar todas las subcategorías encontradas (vacío si no hay)
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 * - Series para comparativa: si windowGranularity==='y' → agrupar YYYY-MM (máx 12 buckets)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  getCategorySearchPattern,
  getTownSearchPattern,
} from "@/lib/taxonomy/patterns";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

/* ==================== Tipos ==================== */

export type CategoryTownSubcatData = {
  subcategoryName: string; // Texto crudo normalizado
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
  series?: Array<{ time: string; value: number }>; // Series para comparativa
};

export type CategoryTownSubcatBreakdownResponse = {
  categoryId: CategoryId;
  townId: TownId;
  subcategories: CategoryTownSubcatData[];
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
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

export type FetchCategoryTownSubcatBreakdownParams = {
  categoryId: CategoryId;
  townId: TownId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  /** Optional: representative raw segment token for the category (from L1) */
  representativeCategoryRaw?: string | null;
  /** Optional: representative raw segment token for the town (from L1) */
  representativeTownRaw?: string | null;
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
 * Filtra solo claves con profundidad 4: root.<categoria>.<town>.<subcat>
 */
function parseSubcategories(
  data: Record<string, Array<{ time: string; value: number }>>,
  opts: {
    categoryToken: string;
    categoryWildcard: boolean;
    townToken: string;
    townWildcard: boolean;
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
    if (!matchSeg(parts[1], opts.categoryToken, opts.categoryWildcard))
      continue;
    if (!matchSeg(parts[2], opts.townToken, opts.townWildcard)) continue;

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
    patterns: pattern,
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
 * Obtiene breakdown de subcategorías para categoría+town específico
 */
export async function fetchCategoryTownSubcatBreakdown({
  categoryId,
  townId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
  representativeCategoryRaw = null,
  representativeTownRaw = null,
}: FetchCategoryTownSubcatBreakdownParams): Promise<CategoryTownSubcatBreakdownResponse> {
  // 1. Determinar tokens y wildcard para categoría y town
  const catPat = representativeCategoryRaw
    ? { token: representativeCategoryRaw, wildcard: false }
    : getCategorySearchPattern(categoryId);
  const townPat = representativeTownRaw
    ? { token: representativeTownRaw, wildcard: false }
    : getTownSearchPattern(townId);

  // 2. Calcular rangos
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 3. Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // 4. Pattern para Nivel 2 con wildcard selectivo
    const pattern = `root.${catPat.token}${catPat.wildcard ? "*" : ""}.${
      townPat.token
    }${townPat.wildcard ? "*" : ""}.*`;

    // 5. POST dual (current + previous) con granularity="d"
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

    // 6. Parsear subcategorías (profundidad 4)
    const currentSubcats = parseSubcategories(currentData, {
      categoryToken: catPat.token,
      categoryWildcard: catPat.wildcard,
      townToken: townPat.token,
      townWildcard: townPat.wildcard,
    });
    const previousSubcats = parseSubcategories(previousData, {
      categoryToken: catPat.token,
      categoryWildcard: catPat.wildcard,
      townToken: townPat.token,
      townWildcard: townPat.wildcard,
    });

    // 7. Obtener todas las subcategorías únicas
    const allSubcatNames = new Set<string>([
      ...currentSubcats.keys(),
      ...previousSubcats.keys(),
    ]);

    // 8. Construir lista de subcategorías con totales y deltas
    const subcategories: CategoryTownSubcatData[] = Array.from(allSubcatNames)
      .map((subcatName) => {
        const currentSeries = currentSubcats.get(subcatName) || [];
        const prevSeries = previousSubcats.get(subcatName) || [];

        const currentTotal = sumSeries(currentSeries);
        const prevTotal = sumSeries(prevSeries);
        const deltaAbs = currentTotal - prevTotal;
        const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

        // Series para comparativa: usar current y agrupar si es anual
        let series = currentSeries;
        if (windowGranularity === "y" && currentSeries.length > 0) {
          series = groupSeriesByMonth(currentSeries);
        }

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

    // 9. Metadata
    return {
      categoryId,
      townId,
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
