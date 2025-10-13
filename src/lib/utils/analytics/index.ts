/**
 * Índice de utilidades de Analytics - Google Analytics 4
 * Exporta todas las funcionalidades relacionadas con GA4, autenticación y manejo de errores
 */

// Autenticación y configuración
export * from "./auth";

// Cliente GA4 y funciones principales
export * from "./ga4";

// Consultas específicas (evitar duplicaciones)
export {
  createPageViewRequest,
  createResponseItems,
  createStandardResponse,
  executeGA4Query,
  extractStandardParams,
  processGA4Rows,
  setupGA4Client,
} from "./analytics-queries";

// Validadores (evitar duplicaciones)
export {
  validateAnalyticsParams,
  validateAndSanitizeUrlPath,
  validateDateRange,
  validateGA4Environment,
  validateGranularity,
  validateISODate,
} from "./analytics-validators";

// Manejo de errores específicos de GA4
export type { GA4ErrorDetails, GA4ErrorType } from "./error-handler";

export {
  classifyGA4Error,
  createErrorResponse as createGA4ErrorResponse,
  handleGA4Error,
  withRetry,
} from "./error-handler";

// Evitar conflicto con createErrorResponse
export { createErrorResponse as createValidationErrorResponse } from "./analytics-validators";

// Requests y utilidades específicas
export * from "./ga4Requests";
