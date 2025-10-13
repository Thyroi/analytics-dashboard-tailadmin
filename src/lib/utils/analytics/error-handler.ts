/**
 * Manejo robusto de errores específicos de Google Analytics 4
 * Consolidación y mejora del error handling para GA4
 */

import { NextResponse } from "next/server";

/* =================== TIPOS DE ERRORES GA4 =================== */

export type GA4ErrorType =
  | "QUOTA_EXCEEDED"
  | "INVALID_CREDENTIALS"
  | "PROPERTY_NOT_FOUND"
  | "INVALID_REQUEST"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

export type GA4ErrorDetails = {
  type: GA4ErrorType;
  message: string;
  originalError?: unknown;
  retryable: boolean;
  statusCode: number;
  retryAfter?: number; // Para rate limiting
};

/* =================== PATTERNS DE ERRORES GA4 =================== */

const ERROR_PATTERNS = {
  QUOTA_EXCEEDED: [
    /quota.*exceeded/i,
    /rate.*limit/i,
    /too many requests/i,
    /exhausted.*tokens/i,
  ],
  INVALID_CREDENTIALS: [
    /invalid.*credentials/i,
    /authentication.*failed/i,
    /unauthorized/i,
    /invalid.*token/i,
  ],
  PROPERTY_NOT_FOUND: [
    /property.*not.*found/i,
    /invalid.*property/i,
    /property.*does.*not.*exist/i,
  ],
  INVALID_REQUEST: [
    /invalid.*request/i,
    /bad.*request/i,
    /malformed/i,
    /invalid.*parameter/i,
  ],
  PERMISSION_DENIED: [/permission.*denied/i, /access.*denied/i, /forbidden/i],
  NETWORK_ERROR: [
    /network.*error/i,
    /connection.*failed/i,
    /timeout/i,
    /econnreset/i,
    /enotfound/i,
  ],
};

/* =================== CLASIFICADOR DE ERRORES =================== */

/** Clasifica errores de GA4 según el tipo y características */
export function classifyGA4Error(error: unknown): GA4ErrorDetails {
  // Error es null/undefined
  if (!error) {
    return {
      type: "UNKNOWN",
      message: "Unknown error occurred",
      retryable: false,
      statusCode: 500,
    };
  }

  // Extraer información del error de forma segura
  const errorObj = error as Record<string, unknown>;
  const errorMessage = String(
    errorObj.message || errorObj.toString?.() || "Unknown error"
  );
  const errorCode = Number(errorObj.code || errorObj.status || 0);

  // Clasificar por código HTTP primero
  if (errorCode === 429) {
    return {
      type: "QUOTA_EXCEEDED",
      message: "Rate limit exceeded. Please try again later.",
      originalError: error,
      retryable: true,
      statusCode: 429,
      retryAfter: 3600, // 1 hora por defecto
    };
  }

  if (errorCode === 401) {
    return {
      type: "INVALID_CREDENTIALS",
      message: "Invalid or expired credentials",
      originalError: error,
      retryable: false,
      statusCode: 401,
    };
  }

  if (errorCode === 403) {
    return {
      type: "PERMISSION_DENIED",
      message: "Access denied to the requested resource",
      originalError: error,
      retryable: false,
      statusCode: 403,
    };
  }

  if (errorCode === 404) {
    return {
      type: "PROPERTY_NOT_FOUND",
      message: "Analytics property not found",
      originalError: error,
      retryable: false,
      statusCode: 404,
    };
  }

  if (errorCode === 400) {
    return {
      type: "INVALID_REQUEST",
      message: "Invalid request parameters",
      originalError: error,
      retryable: false,
      statusCode: 400,
    };
  }

  // Clasificar por patrones de mensaje
  for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(errorMessage))) {
      return {
        type: errorType as GA4ErrorType,
        message: errorMessage,
        originalError: error,
        retryable:
          errorType === "QUOTA_EXCEEDED" || errorType === "NETWORK_ERROR",
        statusCode: getStatusCodeForErrorType(errorType as GA4ErrorType),
      };
    }
  }

  // Error desconocido
  return {
    type: "UNKNOWN",
    message: errorMessage,
    originalError: error,
    retryable: false,
    statusCode: 500,
  };
}

/* =================== HELPERS =================== */

function getStatusCodeForErrorType(type: GA4ErrorType): number {
  switch (type) {
    case "QUOTA_EXCEEDED":
      return 429;
    case "INVALID_CREDENTIALS":
      return 401;
    case "PERMISSION_DENIED":
      return 403;
    case "PROPERTY_NOT_FOUND":
      return 404;
    case "INVALID_REQUEST":
      return 400;
    case "NETWORK_ERROR":
      return 503;
    case "TIMEOUT":
      return 408;
    default:
      return 500;
  }
}

/* =================== RESPONSE BUILDERS =================== */

/** Crea respuesta HTTP apropiada para errores GA4 */
export function createErrorResponse(
  errorDetails: GA4ErrorDetails
): NextResponse {
  const response = NextResponse.json(
    {
      error: errorDetails.message,
      type: errorDetails.type,
      retryable: errorDetails.retryable,
    },
    { status: errorDetails.statusCode }
  );

  // Agregar headers específicos para rate limiting
  if (errorDetails.type === "QUOTA_EXCEEDED" && errorDetails.retryAfter) {
    response.headers.set("Retry-After", errorDetails.retryAfter.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      (Date.now() + errorDetails.retryAfter * 1000).toString()
    );
  }

  return response;
}

/** Handler unificado para errores GA4 en endpoints */
export function handleGA4Error(error: unknown, context?: string): NextResponse {
  const errorDetails = classifyGA4Error(error);

  // Log del error para debugging
  console.error(`[GA4 Error${context ? ` - ${context}` : ""}]:`, {
    type: errorDetails.type,
    message: errorDetails.message,
    statusCode: errorDetails.statusCode,
    retryable: errorDetails.retryable,
  });

  return createErrorResponse(errorDetails);
}

/* =================== UTILIDADES DE RETRY =================== */

export type RetryConfig = {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/** Ejecuta función con retry automático para errores retryables */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorDetails = classifyGA4Error(error);

      // Si no es retryable o es el último intento, fallar
      if (!errorDetails.retryable || attempt === finalConfig.maxRetries) {
        throw error;
      }

      // Calcular delay con backoff exponencial
      const delay = Math.min(
        finalConfig.baseDelay *
          Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${
          finalConfig.maxRetries + 1
        } failed, retrying in ${delay}ms:`,
        errorDetails.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
