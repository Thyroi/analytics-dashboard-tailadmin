/**
 * /lib/utils/ga4-error-handler.ts
 * Manejo robusto de errores específicos de GA4
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
  | "UNKNOWN";

export type GA4ErrorDetails = {
  type: GA4ErrorType;
  message: string;
  originalError?: unknown;
  retryable: boolean;
  statusCode: number;
};

/* =================== CLASIFICADOR DE ERRORES =================== */

/** Clasifica errores de GA4 según el tipo */
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

  // Quota/Rate limiting
  if (
    errorCode === 429 ||
    errorMessage.includes("quota") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("RATE_LIMIT_EXCEEDED")
  ) {
    return {
      type: "QUOTA_EXCEEDED",
      message: "API rate limit exceeded. Please retry later.",
      originalError: error,
      retryable: true,
      statusCode: 429,
    };
  }

  // Credenciales inválidas
  if (
    errorCode === 401 ||
    errorCode === 403 ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("forbidden") ||
    errorMessage.includes("credentials")
  ) {
    return {
      type: "INVALID_CREDENTIALS",
      message: "Invalid or expired credentials",
      originalError: error,
      retryable: false,
      statusCode: 401,
    };
  }

  // Propiedad no encontrada
  if (
    errorCode === 404 ||
    errorMessage.includes("property not found") ||
    errorMessage.includes("does not exist") ||
    errorMessage.includes("PROPERTY_NOT_FOUND")
  ) {
    return {
      type: "PROPERTY_NOT_FOUND",
      message: "Analytics property not found or not accessible",
      originalError: error,
      retryable: false,
      statusCode: 404,
    };
  }

  // Request inválido
  if (
    errorCode === 400 ||
    errorMessage.includes("invalid request") ||
    errorMessage.includes("bad request") ||
    errorMessage.includes("INVALID_ARGUMENT")
  ) {
    return {
      type: "INVALID_REQUEST",
      message: "Invalid request parameters",
      originalError: error,
      retryable: false,
      statusCode: 400,
    };
  }

  // Timeout
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("TIMEOUT") ||
    String(errorObj.code) === "ETIMEDOUT"
  ) {
    return {
      type: "TIMEOUT",
      message: "Request timed out",
      originalError: error,
      retryable: true,
      statusCode: 408,
    };
  }

  // Errores de red
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("ENOTFOUND") ||
    errorMessage.includes("ECONNREFUSED")
  ) {
    return {
      type: "NETWORK_ERROR",
      message: "Network connection error",
      originalError: error,
      retryable: true,
      statusCode: 503,
    };
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

/* =================== RESPUESTAS DE ERROR =================== */

/** Crea una respuesta HTTP apropiada para errores de GA4 */
export function createGA4ErrorResponse(error: unknown): NextResponse {
  const classified = classifyGA4Error(error);

  // Log del error para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.error("GA4 Error Details:", {
      type: classified.type,
      message: classified.message,
      retryable: classified.retryable,
      originalError: classified.originalError,
    });
  }

  // En producción, log solo información básica
  console.error(`GA4 ${classified.type}: ${classified.message}`);

  const responseBody = {
    error: classified.message,
    type: classified.type,
    retryable: classified.retryable,
    timestamp: new Date().toISOString(),
    // Solo incluir detalles del error original en desarrollo
    ...(process.env.NODE_ENV === "development" && {
      details: String(
        (classified.originalError as Record<string, unknown>)?.message ||
          "No details available"
      ),
    }),
  };

  return NextResponse.json(responseBody, {
    status: classified.statusCode,
  });
}

/* =================== RETRY LOGIC =================== */

/** Ejecuta una operación GA4 con retry automático */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const classified = classifyGA4Error(error);

      // Si no es retryable o es el último intento, lanzar error
      if (!classified.retryable || attempt === maxRetries) {
        throw error;
      }

      // Esperar antes del siguiente intento (exponential backoff)
      const delay = delayMs * Math.pow(2, attempt);
      console.warn(
        `GA4 operation failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/* =================== VALIDACIÓN DE CONFIGURACIÓN =================== */

/** Valida que la configuración de GA4 sea correcta */
export function validateGA4Config(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredEnvVars = [
    "GA_CLIENT_EMAIL",
    "GA_PRIVATE_KEY",
    "GA_PROPERTY_ID",
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === "") {
      errors.push(`Missing environment variable: ${envVar}`);
    }
  }

  // Validar formato del email
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  if (clientEmail && !clientEmail.includes("@")) {
    errors.push("GA_CLIENT_EMAIL must be a valid email address");
  }

  // Validar formato de la private key
  const privateKey = process.env.GA_PRIVATE_KEY;
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    errors.push("GA_PRIVATE_KEY must be a valid private key");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/* =================== HELPERS PARA LOGGING =================== */

/** Log seguro de errores GA4 (sin exponer información sensible) */
export function logGA4Error(error: unknown, context?: string) {
  const classified = classifyGA4Error(error);

  const logData = {
    timestamp: new Date().toISOString(),
    context: context || "GA4_OPERATION",
    type: classified.type,
    message: classified.message,
    retryable: classified.retryable,
    statusCode: classified.statusCode,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("GA4 Error:", logData, classified.originalError);
  } else {
    console.error("GA4 Error:", logData);
  }
}
