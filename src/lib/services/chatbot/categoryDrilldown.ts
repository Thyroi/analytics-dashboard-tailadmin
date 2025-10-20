/**
 * Service para obtener drilldown de categorías desde chatbot audit tags API
 * Conecta con /api/chatbot/audit/tags/overview usando patterns root.{categoryId}.*.*
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

/** Parámetros para la query de drilldown de categoría */
export type CategoryDrilldownParams = {
  categoryId: CategoryId;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
};

/** Estructura de un punto de datos en el tiempo */
export type TagAuditTimePoint = {
  time: string; // formato "YYYYMMDD"
  value: number;
};

/** Raw response del API */
export type CategoryDrilldownRawResponse = {
  code: number;
  output: Record<string, TagAuditTimePoint[]>;
  meta?: {
    range?: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
    granularity?: Granularity;
    timezone?: string;
  };
};

/** Subcategoría procesada */
export type SubcategoryData = {
  key: string; // "root.playas.almonte"
  label: string; // "Almonte"
  fullPath: string; // "root.playas.almonte"
  level: number; // 3 (número de niveles desde root)
  hasChildren: boolean; // true si tiene sub-niveles
  totalValue: number; // suma de todos los valores
  timeSeriesData: TagAuditTimePoint[]; // datos temporales originales
};

/** Response procesada */
export type CategoryDrilldownResponse = {
  categoryId: CategoryId;
  subcategories: SubcategoryData[];
  totalInteractions: number;
  timeRange: {
    start: string;
    end: string;
  };
  meta: {
    granularity: Granularity;
    rawKeysCount: number;
  };
};

/** Error personalizado para el servicio */
export class CategoryDrilldownError extends Error {
  constructor(
    message: string,
    public code: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = "CategoryDrilldownError";
  }
}

/**
 * Procesa las keys del output para crear subcategorías
 */
function processSubcategories(
  output: Record<string, TagAuditTimePoint[]>,
  categoryId: CategoryId
): SubcategoryData[] {
  const prefix = `root.${categoryId}.`;
  const subcategoriesMap = new Map<string, SubcategoryData>();

  // Primero, identificar todas las keys que pertenecen a esta categoría
  const relevantKeys = Object.keys(output).filter(
    (key) => key.startsWith(prefix) && key !== `root.${categoryId}`
  );

  // Procesar cada key para extraer subcategorías
  relevantKeys.forEach((fullKey) => {
    const timeSeriesData = output[fullKey] || [];
    const totalValue = timeSeriesData.reduce(
      (sum, point) => sum + point.value,
      0
    );

    // Extraer el path después del prefijo
    const pathAfterCategory = fullKey.substring(prefix.length);
    const pathSegments = pathAfterCategory.split(".");

    // Crear subcategoría del primer nivel después de la categoría
    const firstSegment = pathSegments[0];
    const subcategoryKey = `${prefix}${firstSegment}`;
    const level = subcategoryKey.split(".").length;

    if (!subcategoriesMap.has(subcategoryKey)) {
      subcategoriesMap.set(subcategoryKey, {
        key: subcategoryKey,
        label: formatLabel(firstSegment),
        fullPath: subcategoryKey,
        level,
        hasChildren: false,
        totalValue: 0,
        timeSeriesData: [],
      });
    }

    const subcategory = subcategoriesMap.get(subcategoryKey)!;

    // Acumular valores
    subcategory.totalValue += totalValue;
    subcategory.timeSeriesData = mergeTimeSeries(
      subcategory.timeSeriesData,
      timeSeriesData
    );

    // Marcar si tiene children (paths más profundos)
    if (pathSegments.length > 1) {
      subcategory.hasChildren = true;
    }
  });

  // Convertir a array y ordenar por totalValue descendente
  return Array.from(subcategoriesMap.values()).sort(
    (a, b) => b.totalValue - a.totalValue
  );
}

/**
 * Formatea un segment de path en un label legible
 */
function formatLabel(segment: string): string {
  return segment
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Merge time series data, sumando valores para fechas coincidentes
 */
function mergeTimeSeries(
  existing: TagAuditTimePoint[],
  newData: TagAuditTimePoint[]
): TagAuditTimePoint[] {
  const merged = new Map<string, number>();

  // Agregar valores existentes
  existing.forEach((point) => {
    merged.set(point.time, (merged.get(point.time) || 0) + point.value);
  });

  // Agregar nuevos valores
  newData.forEach((point) => {
    merged.set(point.time, (merged.get(point.time) || 0) + point.value);
  });

  // Convertir a array y ordenar por fecha
  return Array.from(merged.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Convierte fecha YYYY-MM-DD a YYYYMMDD
 */
function formatDateForAPI(dateString: string): string {
  return dateString.replace(/-/g, "");
}

/**
 * Construye la URL para la query según parámetros
 * DEPRECATED: Ahora usamos POST, no GET
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildQueryUrl(params: CategoryDrilldownParams): string {
  const url = new URL("/api/chatbot/audit/tags", window.location.origin);

  // Pattern para obtener todos los sub-niveles de la categoría
  url.searchParams.set("patterns", `root.${params.categoryId}.*.*`);

  // Granularidad del usuario (afecta rangos de fechas)
  url.searchParams.set("granularity", params.granularity);

  // Fechas específicas si se proporcionan (convertir a formato YYYYMMDD)
  if (params.startDate && params.startDate.trim() !== "") {
    try {
      url.searchParams.set("start", formatDateForAPI(params.startDate));
    } catch (error) {
      console.error("Error formatting startDate:", params.startDate, error);
    }
  }
  if (params.endDate && params.endDate.trim() !== "") {
    try {
      url.searchParams.set("end", formatDateForAPI(params.endDate));
    } catch (error) {
      console.error("Error formatting endDate:", params.endDate, error);
    }
  }

  // Database
  if (params.db) {
    url.searchParams.set("db", params.db);
  }

  return url.toString();
}

/**
 * Fetch principal del drilldown de categoría
 */
export async function fetchCategoryDrilldown(
  params: CategoryDrilldownParams
): Promise<CategoryDrilldownResponse> {
  try {
    // Construir payload para POST (no usar buildQueryUrl)
    const payload: {
      db: string;
      patterns: string;
      granularity: "d";
      startTime?: string;
      endTime?: string;
    } = {
      db: params.db || "project_huelva",
      patterns: `root.${params.categoryId}.*.*`, // Patrón específico para la categoría
      granularity: "d" as const, // Siempre "d" para la API interna
    };

    // Agregar fechas si se proporcionan
    if (params.startDate && params.startDate.trim() !== "") {
      payload.startTime = formatDateForAPI(params.startDate);
    }
    if (params.endDate && params.endDate.trim() !== "") {
      payload.endTime = formatDateForAPI(params.endDate);
    }

    const response = await fetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new CategoryDrilldownError(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status
      );
    }

    const rawData: CategoryDrilldownRawResponse = await response.json();

    if (rawData.code !== 200) {
      throw new CategoryDrilldownError(
        `API returned error code: ${rawData.code}`,
        rawData.code
      );
    }

    // Procesar subcategorías
    const subcategories = processSubcategories(
      rawData.output,
      params.categoryId
    );
    const totalInteractions = subcategories.reduce(
      (sum, sub) => sum + sub.totalValue,
      0
    );

    return {
      categoryId: params.categoryId,
      subcategories,
      totalInteractions,
      timeRange: {
        start: rawData.meta?.range?.current.start || "",
        end: rawData.meta?.range?.current.end || "",
      },
      meta: {
        granularity: params.granularity,
        rawKeysCount: Object.keys(rawData.output).length,
      },
    };
  } catch (error) {
    if (error instanceof CategoryDrilldownError) {
      throw error;
    }

    throw new CategoryDrilldownError(
      "Failed to fetch category drilldown data",
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Valida los parámetros antes del fetch
 */
export function validateCategoryDrilldownParams(
  params: CategoryDrilldownParams
): string | null {
  if (!params.categoryId) {
    return "categoryId is required";
  }

  if (!["d", "w", "m", "y"].includes(params.granularity)) {
    return "granularity must be one of: d, w, m, y";
  }

  // Validar formato de fechas si se proporcionan
  if (params.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.startDate)) {
    return "startDate must be in YYYY-MM-DD format";
  }

  if (params.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.endDate)) {
    return "endDate must be in YYYY-MM-DD format";
  }

  return null;
}
