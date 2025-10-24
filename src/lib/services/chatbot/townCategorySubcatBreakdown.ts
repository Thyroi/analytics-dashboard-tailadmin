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
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

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
  };
};

export type FetchTownCategorySubcatBreakdownParams = {
  townId: TownId;
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
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
function parseSubcategories(
  data: Record<string, Array<{ time: string; value: number }>>,
  townId: string,
  categoryId: string
): Map<string, Array<{ time: string; value: number }>> {
  const result = new Map<string, Array<{ time: string; value: number }>>();

  for (const [key, series] of Object.entries(data)) {
    const parts = key.split(".");
    if (parts.length !== 4) continue; // Solo profundidad 4
    if (parts[0] !== "root") continue;
    if (parts[1] !== townId) continue;
    if (parts[2] !== categoryId) continue;

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
  const response = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pattern,
      granularity,
      startTime,
      endTime,
      db,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Mindsaic API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  return json.data || {};
}

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de subcategorías para un town+categoría específico
 */
export async function fetchTownCategorySubcatBreakdown({
  townId,
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
}: FetchTownCategorySubcatBreakdownParams): Promise<TownCategorySubcatBreakdownResponse> {
  // 1. Calcular rangos
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // 3. Pattern para Nivel 2: root.<town>.<cat>.*
    const pattern = `root.${townId}.${categoryId}.*`;

    // 4. POST dual (current + previous) con granularity="d"
    const [currentData, previousData] = await Promise.all([
      fetchMindsaicData(
        pattern,
        "d", // Siempre "d" para Mindsaic
        ranges.current.start.replace(/-/g, ""), // YYYYMMDD
        ranges.current.end.replace(/-/g, ""),
        db,
        controller.signal
      ),
      fetchMindsaicData(
        pattern,
        "d",
        ranges.previous.start.replace(/-/g, ""),
        ranges.previous.end.replace(/-/g, ""),
        db,
        controller.signal
      ),
    ]);

    // 5. Parsear subcategorías (profundidad 4)
    const currentSubcats = parseSubcategories(currentData, townId, categoryId);
    const previousSubcats = parseSubcategories(
      previousData,
      townId,
      categoryId
    );

    // 6. Obtener todas las subcategorías únicas
    const allSubcatNames = new Set<string>([
      ...currentSubcats.keys(),
      ...previousSubcats.keys(),
    ]);

    // 7. Construir lista de subcategorías con totales y deltas
    const subcategories: TownCategorySubcatData[] = Array.from(allSubcatNames)
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

    // 8. Metadata
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
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
