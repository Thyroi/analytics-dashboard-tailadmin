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
 *
 * NUEVO: Soporte para othersOnly (navegar "Otros" de nivel 1)
 */

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  CHATBOT_CATEGORY_NEEDS_WILDCARD,
  CHATBOT_CATEGORY_TOKENS,
} from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import {
  CHATBOT_TOWN_NEEDS_WILDCARD,
  CHATBOT_TOWN_TOKENS,
} from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { bucketize } from "./bucketizer";
import {
  computeDeltaPercent,
  normalizeForAPI,
  normalizeSubcategoryName,
} from "./shared/helpers";
import {
  collectUniverseForView,
  type UniverseRecord,
  type ViewParams,
} from "./universeCollector";

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
  /** Si true, solo mostrar claves que NO mapearon en nivel 1 (navegación desde "Otros") */
  othersOnly?: boolean;
};

/**
 * Filtra solo claves con profundidad 4: root.<cat>.<town>.<subcat>
 */
// Función legacy - mantener por si es necesaria en el futuro
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
  try {
    const json = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })) as unknown;

    let output: unknown = {};
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      output = j.output ?? j.data ?? {};
    }

    return output as Record<string, Array<{ time: string; value: number }>>;
  } catch (err) {
    if (err instanceof ChallengeError) return {};
    throw err;
  }
}

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de subcategorías para categoría+town específico
 * REFACTORIZADO: Usa collectUniverseForView para universo unificado entre donut y series
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
  othersOnly = false,
}: FetchCategoryTownSubcatBreakdownParams): Promise<CategoryTownSubcatBreakdownResponse> {
  // 1. Determinar tokens para categoría y town
  let catToken: string;
  if (representativeCategoryRaw) {
    catToken = normalizeForAPI(representativeCategoryRaw);
  } else {
    const rawToken = CHATBOT_CATEGORY_TOKENS[categoryId];
    catToken = normalizeForAPI(rawToken);
  }

  // Verificar si la categoría necesita wildcard (excepción)
  const needsWildcard =
    !representativeCategoryRaw &&
    CHATBOT_CATEGORY_NEEDS_WILDCARD.has(categoryId);
  const catPart = needsWildcard ? `${catToken}*` : catToken;

  const townToken = representativeTownRaw
    ? normalizeForAPI(representativeTownRaw)
    : normalizeForAPI(CHATBOT_TOWN_TOKENS[townId]);

  // Verificar si el pueblo necesita wildcard (solo cuando no usamos representativeTownRaw)
  const townNeedsWildcard =
    !representativeTownRaw && CHATBOT_TOWN_NEEDS_WILDCARD.has(townId);
  const townPart = townNeedsWildcard ? `${townToken}*` : townToken;

  // 2. Calcular rangos
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 3. Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // 4. Pattern para Nivel 2 (con wildcard solo para excepciones)
    const pattern = `root.${catPart}.${townPart}.*`;

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

    // 6. NUEVO: Usar collectUniverseForView para universo unificado
    const viewParams: ViewParams = {
      level: othersOnly ? 1 : 2, // Si othersOnly, filtrar nivel 1 (depth=3) para obtener no-mapeados
      categoryId,
      townId,
      othersOnly,
      granularity: windowGranularity,
      range: ranges,
      navigationType: "category-first",
    };

    const currentRecords = collectUniverseForView(currentData, viewParams);
    const previousRecords = collectUniverseForView(previousData, viewParams);

    // 7. Agrupar por subcategoría (último token de la clave)
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

    // 8. Obtener todas las subcategorías únicas
    const allSubcatNames = new Set<string>([
      ...currentBySubcat.keys(),
      ...previousBySubcat.keys(),
    ]);

    // 9. Construir lista de subcategorías con totales y deltas
    const subcategories: CategoryTownSubcatData[] = Array.from(allSubcatNames)
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
        const series = bucketized.xLabels.map((label, i) => ({
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

    // 10. Metadata
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
