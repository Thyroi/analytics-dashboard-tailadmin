/**
 * /lib/utils/analytics-validators.ts
 * Guards y validadores para endpoints de analytics
 * Hace el código más robusto y seguro
 * 
 * ⚠️ MIGRADO A UTC - Usa addDaysUTC, todayUTC en lugar de .setDate()
 */

import type { Granularity } from "@/lib/types";
import { addDaysUTC, parseISO, todayUTC, toISO } from "@/lib/utils/time/datetime";

/* =================== TIPOS PARA VALIDACIÓN =================== */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ValidatedAnalyticsParams = {
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

export type ValidatedDateRange = {
  start: string;
  end: string;
  isValid: boolean;
  daysCount: number;
};

/* =================== VALIDADORES DE PARÁMETROS =================== */

/** Valida granularidad desde query param */
export function validateGranularity(
  g: string | null
): ValidationResult<Granularity> {
  if (!g) {
    return { success: true, data: "d" }; // default
  }

  const granularity = g.trim().toLowerCase();

  if (!["d", "w", "m", "y"].includes(granularity)) {
    return {
      success: false,
      error: "Invalid granularity. Must be one of: d, w, m, y",
      code: "INVALID_GRANULARITY",
    };
  }

  return { success: true, data: granularity as Granularity };
}

/** Valida fecha ISO (YYYY-MM-DD) */
export function validateISODate(
  dateStr: string | null
): ValidationResult<string | null> {
  if (!dateStr) {
    return { success: true, data: null };
  }

  const trimmed = dateStr.trim();

  // Regex básico para YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(trimmed)) {
    return {
      success: false,
      error: "Invalid date format. Expected YYYY-MM-DD",
      code: "INVALID_DATE_FORMAT",
    };
  }

  try {
    const parsed = parseISO(trimmed);
    const normalized = toISO(parsed);

    // Verificar que la fecha sea válida (no cambió al parsear/normalizar)
    if (normalized !== trimmed) {
      return {
        success: false,
        error: "Invalid date value",
        code: "INVALID_DATE_VALUE",
      };
    }

    // Verificar que no sea una fecha muy antigua (más de 5 años) - UTC
    const fiveYearsAgo = addDaysUTC(todayUTC(), -365 * 5);

    if (parsed < fiveYearsAgo) {
      return {
        success: false,
        error: "Date too old. Maximum 5 years in the past",
        code: "DATE_TOO_OLD",
      };
    }

    // Verificar que no sea fecha futura - UTC
    const tomorrow = addDaysUTC(todayUTC(), 1);

    if (parsed > tomorrow) {
      return {
        success: false,
        error: "Future dates not allowed",
        code: "FUTURE_DATE",
      };
    }

    return { success: true, data: trimmed };
  } catch {
    return {
      success: false,
      error: "Failed to parse date",
      code: "DATE_PARSE_ERROR",
    };
  }
}

/** Valida rango de fechas (start <= end, duración razonable) */
export function validateDateRange(
  start: string | null,
  end: string | null
): ValidationResult<ValidatedDateRange | null> {
  if (!start || !end) {
    return { success: true, data: null }; // Sin rango específico
  }

  // Validar fechas individuales primero
  const startValidation = validateISODate(start);
  if (!startValidation.success) {
    return {
      success: false,
      error: `Start date: ${startValidation.error}`,
      code: startValidation.code,
    };
  }

  const endValidation = validateISODate(end);
  if (!endValidation.success) {
    return {
      success: false,
      error: `End date: ${endValidation.error}`,
      code: endValidation.code,
    };
  }

  const startDate = parseISO(start);
  const endDate = parseISO(end);

  // Verificar que start <= end
  if (startDate > endDate) {
    return {
      success: false,
      error: "Start date must be before or equal to end date",
      code: "INVALID_DATE_RANGE",
    };
  }

  // Calcular duración del rango
  const diffMs = endDate.getTime() - startDate.getTime();
  const daysCount = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días

  // Verificar duración máxima (2 años)
  if (daysCount > 730) {
    return {
      success: false,
      error: "Date range too large. Maximum 2 years (730 days)",
      code: "RANGE_TOO_LARGE",
    };
  }

  return {
    success: true,
    data: {
      start,
      end,
      isValid: true,
      daysCount,
    },
  };
}

/** Valida todos los parámetros de analytics de una vez */
export function validateAnalyticsParams(
  searchParams: URLSearchParams
): ValidationResult<ValidatedAnalyticsParams> {
  // Validar granularidad
  const granularityResult = validateGranularity(searchParams.get("g"));
  if (!granularityResult.success) {
    return granularityResult;
  }

  // Validar fechas
  const startQ = searchParams.get("start");
  const endQ = searchParams.get("end");

  const startResult = validateISODate(startQ);
  if (!startResult.success) {
    return startResult;
  }

  const endResult = validateISODate(endQ);
  if (!endResult.success) {
    return endResult;
  }

  // Validar rango si ambas fechas están presentes
  const rangeResult = validateDateRange(startResult.data, endResult.data);
  if (!rangeResult.success) {
    return rangeResult;
  }

  return {
    success: true,
    data: {
      granularity: granularityResult.data,
      startDate: startResult.data,
      endDate: endResult.data,
    },
  };
}

/* =================== VALIDADORES DE URL/PATH =================== */

/** Sanitiza y valida URL path */
export function validateAndSanitizeUrlPath(
  path: string
): ValidationResult<string> {
  if (typeof path !== "string") {
    return {
      success: false,
      error: "Path must be a string",
      code: "INVALID_PATH_TYPE",
    };
  }

  const trimmed = path.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      error: "Path cannot be empty",
      code: "EMPTY_PATH",
    };
  }

  // Verificar longitud máxima
  if (trimmed.length > 2048) {
    return {
      success: false,
      error: "Path too long. Maximum 2048 characters",
      code: "PATH_TOO_LONG",
    };
  }

  // Verificar caracteres peligrosos
  const dangerousChars = /[<>\"';&(){}]/;
  if (dangerousChars.test(trimmed)) {
    return {
      success: false,
      error: "Path contains dangerous characters",
      code: "DANGEROUS_CHARACTERS",
    };
  }

  try {
    // Intentar crear URL para validar formato
    new URL(
      trimmed.startsWith("http")
        ? trimmed
        : `https://example.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`
    );

    return { success: true, data: trimmed };
  } catch {
    return {
      success: false,
      error: "Invalid URL format",
      code: "INVALID_URL_FORMAT",
    };
  }
}

/* =================== VALIDADOR DE PARÁMETROS GA4 =================== */

/** Valida que los parámetros de GA4 estén disponibles */
export function validateGA4Environment(): ValidationResult<boolean> {
  const requiredEnvs = ["GA_CLIENT_EMAIL", "GA_PRIVATE_KEY", "GA_PROPERTY_ID"];

  for (const envVar of requiredEnvs) {
    const value = process.env[envVar];
    if (!value || value.trim() === "") {
      return {
        success: false,
        error: `Missing required environment variable: ${envVar}`,
        code: "MISSING_ENV_VAR",
      };
    }
  }

  return { success: true, data: true };
}

/* =================== HELPER PARA RESPUESTAS DE ERROR =================== */

/** Crea respuesta de error consistente para APIs */
export function createErrorResponse(
  error: string,
  code?: string,
  status: number = 400
) {
  return Response.json(
    {
      error,
      code: code || "VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
