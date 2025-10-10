/**
 * Utilidades comunes para queries de Analytics con validación robusta
 * Funciones reutilizables para evitar duplicación de código
 */

import type { Granularity } from "@/lib/types";
import {
  validateAndSanitizeUrlPath,
  type ValidationResult,
} from "@/lib/utils/analytics-validators";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import {
  executeWithRetry,
  validateGA4Config,
} from "@/lib/utils/ga4-error-handler";
import { buildUnionRunReportRequest } from "@/lib/utils/ga4Requests";
import {
  computeDeltaPct,
  computeRangesFromQuery,
  safeUrlPathname,
} from "@/lib/utils/timeWindows";
import { google } from "googleapis";

/** Configuración común de GA4 con validación */
export function setupGA4Client(): ValidationResult<{
  analytics: ReturnType<typeof google.analyticsdata>;
  property: string;
}> {
  // Validar configuración de GA4
  const configValidation = validateGA4Config();
  if (!configValidation.isValid) {
    return {
      success: false,
      error: `GA4 configuration error: ${configValidation.errors.join(", ")}`,
      code: "GA4_CONFIG_ERROR",
    };
  }

  try {
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    return {
      success: true,
      data: { analytics, property },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to setup GA4 client: ${String(error)}`,
      code: "GA4_SETUP_ERROR",
    };
  }
}

/** Extrae parámetros de query estándar */
export function extractStandardParams(searchParams: URLSearchParams) {
  const granularity = (searchParams.get("g") || "d")
    .trim()
    .toLowerCase() as Granularity;
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");

  return { granularity, startQ, endQ };
}

/** Ejecuta query de GA4 con retry automático y manejo de errores */
export async function executeGA4Query(
  analytics: ReturnType<typeof google.analyticsdata>,
  property: string,
  request: ReturnType<typeof computeRangesFromQuery>
) {
  const unionRequest = createPageViewRequest(request);

  return executeWithRetry(async () => {
    const response = await analytics.properties.runReport({
      property,
      requestBody: unionRequest,
    });

    return response;
  });
}

/** Crea request estándar para page_view events */
export function createPageViewRequest(
  ranges: ReturnType<typeof computeRangesFromQuery>
) {
  return buildUnionRunReportRequest({
    current: ranges.current,
    previous: ranges.previous,
    metrics: [{ name: "eventCount" }],
    dimensions: [
      { name: "date" },
      { name: "pageLocation" },
      { name: "eventName" },
    ],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          matchType: "EXACT",
          value: "page_view",
          caseSensitive: false,
        },
      },
    },
  });
}

/* =================== RE-EXPORTS DE UTILIDADES =================== */

// Re-exportar utilidades útiles para las rutas
export { validateAnalyticsParams } from "@/lib/utils/analytics-validators";
export { createGA4ErrorResponse } from "@/lib/utils/ga4-error-handler";

/** Procesa filas de GA4 y agrupa por período de tiempo con validación */
export function processGA4Rows<T extends string>(
  rows: Array<{
    dimensionValues?: Array<{ value?: unknown }>;
    metricValues?: Array<{ value?: unknown }>;
  }>,
  ranges: ReturnType<typeof computeRangesFromQuery>,
  matchFunction: (path: string) => T | null
): {
  currentTotals: Record<T, number>;
  previousTotals: Record<T, number>;
  processedRows: number;
  skippedRows: number;
} {
  const currentTotals = {} as Record<T, number>;
  const previousTotals = {} as Record<T, number>;
  let processedRows = 0;
  let skippedRows = 0;

  console.log("=== processGA4Rows Debug ===");
  console.log("Input rows count:", rows.length);
  console.log("Date ranges:", ranges);

  for (const r of rows) {
    try {
      const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
      if (dateRaw.length !== 8) {
        console.log("Invalid date format:", dateRaw);
        skippedRows++;
        continue;
      }

      const iso = `${dateRaw.slice(0, 4)}-${dateRaw.slice(
        4,
        6
      )}-${dateRaw.slice(6, 8)}`;
      const url = String(r.dimensionValues?.[1]?.value ?? "");

      // Validar y sanitizar el path
      const pathValidation = validateAndSanitizeUrlPath(url);
      if (!pathValidation.success) {
        console.log("Path validation failed for:", url, pathValidation.error);
        skippedRows++;
        continue;
      }

      const path = safeUrlPathname(pathValidation.data);
      const value = Number(r.metricValues?.[0]?.value ?? 0);

      console.log("Processing row:", { iso, url, path, value });

      // Validar que el valor sea un número válido
      if (isNaN(value) || value < 0) {
        console.log("Invalid value:", value);
        skippedRows++;
        continue;
      }

      const matchedId = matchFunction(path);
      console.log("Match result:", matchedId);

      if (!matchedId) {
        skippedRows++;
        continue;
      }

      if (iso >= ranges.current.start && iso <= ranges.current.end) {
        currentTotals[matchedId] = (currentTotals[matchedId] || 0) + value;
        processedRows++;
        console.log(
          `Added ${value} to current[${matchedId}], total: ${currentTotals[matchedId]}`
        );
      } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
        previousTotals[matchedId] = (previousTotals[matchedId] || 0) + value;
        processedRows++;
        console.log(
          `Added ${value} to previous[${matchedId}], total: ${previousTotals[matchedId]}`
        );
      } else {
        console.log(`Date ${iso} outside ranges:`, ranges);
        skippedRows++;
      }
    } catch (error) {
      console.warn("Error processing GA4 row:", error);
      skippedRows++;
    }
  }

  console.log("Final totals:", {
    currentTotals,
    previousTotals,
    processedRows,
    skippedRows,
  });
  return { currentTotals, previousTotals, processedRows, skippedRows };
}

/** Crea respuesta estándar para endpoints de totales */
export function createStandardResponse<T>(
  granularity: Granularity,
  ranges: ReturnType<typeof computeRangesFromQuery>,
  property: string,
  items: Array<{
    id: T;
    title: string;
    total: number;
    deltaPct: number | null;
  }>
) {
  return {
    granularity,
    range: ranges,
    property,
    items,
  };
}

/** Crea items de respuesta con delta calculado */
export function createResponseItems<T extends string>(
  ids: T[],
  currentTotals: Record<T, number>,
  previousTotals: Record<T, number>,
  getTitleFunction: (id: T) => string
) {
  return ids.map((id) => {
    const curr = currentTotals[id] ?? 0;
    const prev = previousTotals[id] ?? 0;
    return {
      id,
      title: getTitleFunction(id),
      total: curr,
      deltaPct: computeDeltaPct(curr, prev),
    };
  });
}
