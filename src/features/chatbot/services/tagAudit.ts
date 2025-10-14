/**
 * Servicio para interactuar con la API de auditoría de tags
 * Según especificaciones del prompt maestro
 */

import type { Granularity, TagAuditResponse } from "../types";
import { validateDateFormat } from "../utils/periods";

const API_BASE_URL = "/api/chatbot/audit/tags";
const DB_NAME = "project_huelva";

export type TagAuditParams = {
  patterns: string;
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
};

/**
 * Constructor de error personalizado
 */
export class TagAuditError extends Error {
  public code?: number;
  public details?: unknown;

  constructor(props: { message: string; code?: number; details?: unknown }) {
    super(props.message);
    this.name = "TagAuditError";
    this.code = props.code;
    this.details = props.details;
  }
}

/**
 * Cache simple para evitar llamadas duplicadas
 */
const requestCache = new Map<string, Promise<TagAuditResponse>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Genera clave de cache para una request
 */
function getCacheKey(params: TagAuditParams): string {
  return JSON.stringify({
    patterns: params.patterns,
    granularity: params.granularity,
    startTime: params.startTime,
    endTime: params.endTime,
  });
}

/**
 * Valida parámetros antes de hacer la llamada
 */
function validateParams(params: TagAuditParams): string | null {
  if (!params.patterns) {
    return "Patterns es obligatorio";
  }

  if (!params.patterns.startsWith("root.")) {
    return "Patterns debe comenzar con 'root.'";
  }

  if (!["d", "w", "m", "y"].includes(params.granularity)) {
    return "Granularidad debe ser 'd', 'w', 'm' o 'y'";
  }

  if (
    params.startTime &&
    !validateDateFormat(params.startTime, params.granularity)
  ) {
    return `Formato de startTime inválido para granularidad '${params.granularity}'`;
  }

  if (
    params.endTime &&
    !validateDateFormat(params.endTime, params.granularity)
  ) {
    return `Formato de endTime inválido para granularidad '${params.granularity}'`;
  }

  return null;
}

/**
 * Realiza la llamada a la API de auditoría
 */
export async function fetchTagAudit(
  params: TagAuditParams
): Promise<TagAuditResponse> {
  // Validar parámetros
  const validationError = validateParams(params);
  if (validationError) {
    throw new TagAuditError({
      message: validationError,
      code: 400,
    });
  }

  // Verificar cache
  const cacheKey = getCacheKey(params);
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  // Crear nueva request
  const requestPromise = performRequest(params);
  requestCache.set(cacheKey, requestPromise);

  // Limpiar cache después del TTL
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, CACHE_TTL);

  return requestPromise;
}

/**
 * Ejecuta la request HTTP
 */
async function performRequest(
  params: TagAuditParams
): Promise<TagAuditResponse> {
  const body = {
    db: DB_NAME,
    patterns: params.patterns, // La API espera patterns como string, no array
    granularity: params.granularity,
    ...(params.startTime && { startTime: params.startTime }),
    ...(params.endTime && { endTime: params.endTime }),
  };

  try {
    console.log("🔍 Llamada a API de auditoría:", body);

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new TagAuditError({
        message: `Error HTTP ${response.status}: ${errorText}`,
        code: response.status,
      });
    }

    const data: TagAuditResponse = await response.json();

    if (data.code !== 200) {
      throw new TagAuditError({
        message: `API retornó código ${data.code}`,
        code: data.code,
        details: data,
      });
    }

    console.log("✅ Respuesta de API de auditoría:", {
      code: data.code,
      outputKeys: Object.keys(data.output || {}),
      totalSeries: Object.keys(data.output || {}).length,
    });

    return data;
  } catch (error) {
    console.error("❌ Error en API de auditoría:", error);

    if (error instanceof TagAuditError) {
      throw error;
    }

    throw new TagAuditError({
      message: error instanceof Error ? error.message : "Error desconocido",
      details: error,
    });
  }
}

/**
 * Limpia el cache de requests (útil para testing)
 */
export function clearCache(): void {
  requestCache.clear();
}

/**
 * Genera patterns comunes según las especificaciones
 */
export const PATTERNS = {
  categoryTotal: (category: string) => `root.*.${category}.*`,
  townTotal: (town: string) => `root.${town}.*`,
  allCategories: () => "root.*.*",
  allTowns: () => "root.*",
} as const;
