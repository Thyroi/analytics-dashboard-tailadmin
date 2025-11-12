/**
 * Servicio para obtener breakdown de categorías dentro de un town específico
 *
 * NIVEL 1: Town → Categorías
 *
 * Reglas:
 * - Pattern: "root.<townId>.*" (solo ese town)
 * - Filtro: profundidad === 3 (root.<town>.<categoria>)
 * - POST dual: current + previous con granularity="d"
 * - Mapeo CATEGORY_SYNONYMS case-insensitive
 * - Renderizar TODAS las categorías (0 si no hay datos)
 * - Delta null si prev <= 0
 * - Timeout 15s con AbortController
 * - UTC total, computeRangesForKPI
 */

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import { matchCategoryId } from "@/lib/taxonomy/normalize";
import {
  getTownSearchPattern,
  matchSecondCategory,
  parseKey,
} from "@/lib/taxonomy/patterns";
import type { SeriesPoint } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { OTHERS_ID } from "./partition";
import { computeDeltaPercent, formatDateForMindsaic } from "./shared/helpers";
import { fetchMindsaicDataForTown } from "./shared/mindsaicClient";
import { buildSeriesForRange } from "./shared/seriesBuilder";
import {
  aggregateDailyTotals,
  parseTownCategories,
} from "./shared/townParsers";
import type {
  FetchTownCategoryBreakdownParams,
  TownCategoryBreakdownResponse,
  TownCategoryData,
} from "./shared/types";

// Importar tipos y helpers compartidos
export type {
  FetchTownCategoryBreakdownParams,
  OthersBreakdownEntry,
  TownCategoryBreakdownResponse,
  TownCategoryData,
} from "./shared/types";

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene breakdown de categorías dentro de un town específico
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODAS las categorías aunque no tengan datos (0 y null).
 *
 * NIVEL 1: root.<townId>.<categoria> (profundidad 3)
 */
export async function fetchTownCategoryBreakdown(
  params: FetchTownCategoryBreakdownParams
): Promise<TownCategoryBreakdownResponse> {
  const {
    townId,
    windowGranularity = "d",
    startISO = null,
    endISO = null,
    db = "project_huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStartFormatted = formatDateForMindsaic(ranges.current.start);
  const currentEndFormatted = formatDateForMindsaic(ranges.current.end);
  const prevStartFormatted = formatDateForMindsaic(ranges.previous.start);
  const prevEndFormatted = formatDateForMindsaic(ranges.previous.end);

  // 3. Hacer dos POST paralelos con timeout 15s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const [currentResponse, prevResponse] = await Promise.all([
      fetchMindsaicDataForTown(
        townId,
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicDataForTown(
        townId,
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por categoría (depth=3) - SIN verificación de hijos aún
    const currentResult = parseTownCategories(
      currentResponse.output || {},
      townId
    );
    const prevResult = parseTownCategories(prevResponse.output || {}, townId);

    // 6. VERIFICAR QUÉ CATEGORÍAS TIENEN HIJOS (queries adicionales)
    // Detectar todas las categorías únicas que aparecieron en las keys depth=3
    const detectedCategories = new Set<CategoryId>();
    const output = currentResponse.output || {};

    for (const key of Object.keys(output)) {
      const keyInfo = parseKey(key);
      if (keyInfo && keyInfo.depth === 3) {
        const categoryId = matchSecondCategory(keyInfo);
        if (categoryId) {
          detectedCategories.add(categoryId);
        }
      }
    }
    // Para cada categoría detectada, hacer query de verificación: root.<town>.<cat>.*
    const { token: townToken, wildcard: townWildcard } =
      getTownSearchPattern(townId);
    const verificationController = new AbortController();
    const verificationTimeout = setTimeout(
      () => verificationController.abort(),
      15000
    );

    const categoriesWithChildren = new Set<CategoryId>();

    try {
      const verificationPromises = Array.from(detectedCategories).map(
        async (categoryId) => {
          // Obtener el token de la categoría desde las keys reales (parts[2])
          const categoryKeys = Object.keys(output).filter((k) => {
            const ki = parseKey(k);
            return (
              ki && ki.depth === 3 && matchSecondCategory(ki) === categoryId
            );
          });

          if (categoryKeys.length === 0) return;

          // Tomar el parts[2] de la primera key como representativo
          const firstKey = parseKey(categoryKeys[0]);
          if (!firstKey) return;

          const rawCategoryToken = firstKey.parts[2]; // e.g., "circuito monteblanco"

          // Construir pattern de verificación
          const townPart = townWildcard ? `${townToken} *` : townToken;
          const verificationPattern = `root.${townPart}.${rawCategoryToken}.*`;

          // Hacer query de verificación
          const verificationPayload = {
            db,
            patterns: verificationPattern,
            granularity: "d",
            startTime: currentStartFormatted,
            endTime: currentEndFormatted,
          };

          try {
            const verificationJson = (await safeJsonFetch(
              "/api/chatbot/audit/tags",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(verificationPayload),
                signal: verificationController.signal,
              }
            )) as { output?: Record<string, unknown> };

            const verificationOutput = verificationJson.output || {};
            const hasChildren = Object.keys(verificationOutput).length > 0;

            if (hasChildren) {
              categoriesWithChildren.add(categoryId);
            }
          } catch (err) {
            // If upstream returned a ChallengeError, treat as "no children" so we
            // can safely degrade. AbortErrors and other errors will bubble.
            if (err instanceof ChallengeError) return;
            throw err;
          }
        }
      );

      await Promise.all(verificationPromises);
      clearTimeout(verificationTimeout);
    } catch {
      clearTimeout(verificationTimeout);
    }

    // 7. Reclasificar: categorías SIN hijos van a "Otros"
    const currentTotals = new Map(currentResult.totals);
    const prevTotals = new Map(prevResult.totals);

    for (const categoryId of detectedCategories) {
      if (!categoriesWithChildren.has(categoryId)) {
        // Mover a "Otros"
        const currentVal = currentTotals.get(categoryId) || 0;
        const prevVal = prevTotals.get(categoryId) || 0;

        currentTotals.set(
          OTHERS_ID,
          (currentTotals.get(OTHERS_ID) || 0) + currentVal
        );
        prevTotals.set(OTHERS_ID, (prevTotals.get(OTHERS_ID) || 0) + prevVal);

        currentTotals.set(categoryId, 0);
        prevTotals.set(categoryId, 0);
      }
    }

    // 5b. Construir mapa de raw segments por CategoryId para Nivel 2
    const categoryRawSegmentsById: Record<
      CategoryId,
      Record<string, number>
    > = {} as Record<CategoryId, Record<string, number>>;

    // Recorrer todas las claves de output y agrupar por categoryId
    const addRawToCategory = (key: string, total: number) => {
      const parts = key.split(".");
      if (parts.length !== 3) return; // only depth 3
      const rawSegment = parts[2];
      const catId = matchCategoryId(rawSegment) || ("otros" as CategoryId);
      categoryRawSegmentsById[catId] = categoryRawSegmentsById[catId] || {};
      const prev = categoryRawSegmentsById[catId][rawSegment] || 0;
      categoryRawSegmentsById[catId][rawSegment] = prev + total;
    };

    for (const [k, series] of Object.entries(currentResponse.output || {})) {
      // only depth 3
      const parts = k.split(".");
      if (parts.length !== 3) continue;
      const total = (series as Array<{ value?: number }>).reduce(
        (s: number, p: { value?: number }) => s + (p.value || 0),
        0
      );
      addRawToCategory(k, total);
    }

    // 6. Construir resultado final con TODAS las categorías (sin "otros" si está en 0)
    const categories: TownCategoryData[] = CATEGORY_ID_ORDER.map(
      (categoryId) => {
        const currentTotal = currentTotals.get(categoryId) || 0;
        const prevTotal = prevTotals.get(categoryId) || 0;
        const deltaAbs = currentTotal - prevTotal;
        const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);

        return {
          categoryId,
          label: CATEGORY_META[categoryId].label,
          iconSrc: CATEGORY_META[categoryId].iconSrc,
          currentTotal,
          prevTotal,
          deltaAbs,
          deltaPercent,
        };
      }
    );

    // Agregar "otros" si tiene datos
    const otrosCurrentTotal = currentTotals.get(OTHERS_ID) || 0;
    const otrosPrevTotal = prevTotals.get(OTHERS_ID) || 0;
    if (otrosCurrentTotal > 0 || otrosPrevTotal > 0) {
      categories.push({
        categoryId: OTHERS_ID,
        label: "Otros",
        iconSrc: "/icons/otros.svg", // Placeholder
        currentTotal: otrosCurrentTotal,
        prevTotal: otrosPrevTotal,
        deltaAbs: otrosCurrentTotal - otrosPrevTotal,
        deltaPercent: computeDeltaPercent(otrosCurrentTotal, otrosPrevTotal),
      });
    }

    // 7. Series agregadas por día para el pueblo usando nuevos helpers
    const currentTotalsByISO = aggregateDailyTotals(
      currentResponse.output || {},
      townId
    );
    const prevTotalsByISO = aggregateDailyTotals(
      prevResponse.output || {},
      townId
    );
    const currentSeries: SeriesPoint[] = buildSeriesForRange(
      currentTotalsByISO,
      ranges.current.start,
      ranges.current.end,
      windowGranularity // Pasar granularidad para bucketing correcto
    );
    const previousSeries: SeriesPoint[] = buildSeriesForRange(
      prevTotalsByISO,
      ranges.previous.start,
      ranges.previous.end,
      windowGranularity // Pasar granularidad para bucketing correcto
    );

    return {
      townId,
      categories,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
      categoryRawSegmentsById,
      othersBreakdown: {
        current: currentResult.othersBreakdown,
        previous: prevResult.othersBreakdown,
      },
      meta: {
        granularity: windowGranularity,
        timezone: "UTC",
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
      },
      raw: {
        current: currentResponse,
        previous: prevResponse,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Timeout al consultar categorías del town ${townId} (15s)`
      );
    }

    throw error;
  }
}
