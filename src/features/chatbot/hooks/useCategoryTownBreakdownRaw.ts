/**
 * Hook para obtener breakdown de towns dentro de una categoría
 * Versión RAW sin agrupamiento en "Otros" - para debug/combinación
 *
 * NIVEL 1: Categoría → Towns (category-first, profundidad 3)
 */

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { getCategorySearchPattern } from "@/lib/taxonomy/patterns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { useQuery } from "@tanstack/react-query";

/* ==================== Tipos ==================== */

export type TownBreakdownItem = {
  townId: string; // TownId o token raw sin mapear
  label: string;
  currentTotal: number;
  prevTotal: number;
};

export type SeriesPoint = {
  label: string; // YYYY-MM-DD
  value: number;
};

export type CategoryTownBreakdownRawResponse = {
  categoryId: CategoryId;
  towns: TownBreakdownItem[];
  series: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  meta: {
    granularity: WindowGranularity;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
};

export type UseCategoryTownBreakdownRawParams = {
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  enabled?: boolean;
};

/* ==================== Helpers ==================== */

function formatDateForChatbot(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

function inRange(yyyymmdd: string, start: string, end: string): boolean {
  return yyyymmdd >= start && yyyymmdd <= end;
}

/**
 * Convierte YYYYMMDD a label según granularidad
 * - d, w, m: YYYY-MM-DD (día completo)
 * - y: YYYY-MM (mes)
 */
function bucketizeDate(
  yyyymmdd: string,
  granularity: WindowGranularity
): string {
  const yyyy = yyyymmdd.slice(0, 4);
  const mm = yyyymmdd.slice(4, 6);
  const dd = yyyymmdd.slice(6, 8);

  if (granularity === "y") {
    // Para granularidad anual, agrupar por mes
    return `${yyyy}-${mm}`;
  }

  // Para otras granularidades, usar día completo
  return `${yyyy}-${mm}-${dd}`;
}

/* ==================== Fetch Function ==================== */

async function fetchCategoryTownBreakdownRaw(
  params: UseCategoryTownBreakdownRawParams
): Promise<CategoryTownBreakdownRawResponse> {
  const {
    categoryId,
    startISO = null,
    endISO = null,
    windowGranularity = "d",
    db = "project_huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(windowGranularity, startISO, endISO);

  // 2. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStart = formatDateForChatbot(ranges.current.start);
  const currentEnd = formatDateForChatbot(ranges.current.end);
  const prevStart = formatDateForChatbot(ranges.previous.start);
  const prevEnd = formatDateForChatbot(ranges.previous.end);

  // 3. Construir pattern usando getCategorySearchPattern para manejar aliases
  // Esto convierte categoryId (ej: rutasSenderismo) al token correcto en BD (ej: rutas senderismo y cicloturistas)
  const { token: catToken, wildcard } = getCategorySearchPattern(categoryId);

  // Pattern para nivel 3: root.{category}.{town}
  // NOTA: No incluye nivel 2 (root.{category}) porque esos datos generales
  // ya están siendo sumados por useChatbotCategoryTotals en el total de la categoría
  const pattern = `root.${catToken}${wildcard ? "*" : ""}.*`;

  console.log(`[useCategoryTownBreakdownRaw] Fetching data:`, {
    categoryId,
    catToken,
    pattern,
    wildcard,
    ranges,
    startISO,
    endISO,
  });

  // 4. Hacer POST request para ambos períodos
  const payload = {
    db,
    patterns: pattern,
    granularity: "d",
    startTime: prevStart, // Desde previous.start
    endTime: currentEnd, // Hasta current.end
  };

  try {
    const data = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })) as unknown;

    // Normalize output shape
    const output = ((): Record<
      string,
      Array<{ time: string; value: number }>
    > => {
      if (data && typeof data === "object") {
        const j = data as Record<string, unknown>;
        const maybe = (j.output ?? j.data) as
          | Record<string, Array<{ time: string; value: number }>>
          | undefined;
        return maybe ?? {};
      }
      return {};
    })();

    // 5. Procesar datos raw
    const townTotalsMap = new Map<
      string,
      { currentTotal: number; prevTotal: number }
    >();
    const timeSeriesMap = new Map<string, number>(); // Para current period
    const timeSeriesPrevMap = new Map<string, number>(); // Para previous period

    // Procesar cada key del output
    for (const [key, series] of Object.entries(output)) {
      // Extraer segmentos de root.{category}.{town}
      const segments = key.split(".");

      // IMPORTANTE: Solo contar profundidad exacta = 3 (root.category.town)
      // Ignorar nivel 2 (root.category) porque esos totales ya están en useChatbotCategoryTotals
      // Ignorar niveles más profundos (4+) para evitar doble conteo
      // Ejemplo: root.naturaleza.dehesa_nueva ✅ (profundidad 3)
      //          root.naturaleza ❌ (profundidad 2 - ya contado en totales)
      //          root.naturaleza.dehesa_nueva.bicicleta ❌ (profundidad 4)
      if (segments.length !== 3) continue;

      const townToken = segments[2]; // El token del pueblo (puede estar sin mapear)

      if (!townToken) continue;

      // Inicializar totales si no existen
      if (!townTotalsMap.has(townToken)) {
        townTotalsMap.set(townToken, { currentTotal: 0, prevTotal: 0 });
      }

      const townTotals = townTotalsMap.get(townToken)!;

      // Procesar cada punto temporal
      for (const point of series as Array<{ time: string; value: number }>) {
        const ymd = point.time; // YYYYMMDD
        const value = point.value || 0;

        // Determinar si está en current o previous
        const isInCurrent = inRange(ymd, currentStart, currentEnd);
        const isInPrev = inRange(ymd, prevStart, prevEnd);

        if (isInCurrent) {
          townTotals.currentTotal += value;

          // Acumular en series temporal (bucketizar según granularidad)
          const dateLabel = bucketizeDate(ymd, windowGranularity);
          const currentValue = timeSeriesMap.get(dateLabel) || 0;
          timeSeriesMap.set(dateLabel, currentValue + value);
        }

        if (isInPrev) {
          townTotals.prevTotal += value;

          // Acumular en series temporal previous (bucketizar según granularidad)
          const dateLabel = bucketizeDate(ymd, windowGranularity);
          const currentValue = timeSeriesPrevMap.get(dateLabel) || 0;
          timeSeriesPrevMap.set(dateLabel, currentValue + value);
        }
      }
    }

    // 6. Convertir Maps a arrays
    const towns: TownBreakdownItem[] = Array.from(townTotalsMap.entries())
      .map(([townId, totals]) => ({
        townId,
        label: townId, // Usar el token raw como label
        currentTotal: totals.currentTotal,
        prevTotal: totals.prevTotal,
      }))
      .sort((a, b) => b.currentTotal - a.currentTotal); // Ordenar por valor descendente

    const currentSeries: SeriesPoint[] = Array.from(timeSeriesMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const previousSeries: SeriesPoint[] = Array.from(
      timeSeriesPrevMap.entries()
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      categoryId,
      towns,
      series: {
        current: currentSeries,
        previous: previousSeries,
      },
      meta: {
        granularity: windowGranularity,
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
      },
    };
  } catch (err) {
    if (err instanceof ChallengeError) {
      // Degrade to empty response
      return {
        categoryId,
        towns: [],
        series: { current: [], previous: [] },
        meta: {
          granularity: windowGranularity,
          range: { current: ranges.current, previous: ranges.previous },
        },
      } as CategoryTownBreakdownRawResponse;
    }
    throw err;
  }
}

/* ==================== Hook ==================== */

export function useCategoryTownBreakdownRaw({
  categoryId,
  startISO = null,
  endISO = null,
  windowGranularity = "d",
  db = "project_huelva",
  enabled = true,
}: UseCategoryTownBreakdownRawParams) {
  const queryKey = [
    "chatbot",
    "category",
    "town-breakdown-raw",
    {
      categoryId,
      startISO,
      endISO,
      g: windowGranularity,
      db,
    },
  ];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchCategoryTownBreakdownRaw({
        categoryId,
        startISO,
        endISO,
        windowGranularity,
        db,
      }),
    enabled: enabled && !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
