/**
 * Utilidades para crear donuts simples (sin drill-down)
 *
 * ARQUITECTURA (Refactorizado Fase 2):
 * Este archivo re-exporta funciones desde módulos especializados:
 * - donut/types.ts: Definiciones TypeScript
 * - donut/queries.ts: Consultas a Google Analytics 4
 * - donut/handlers.ts: Request handlers para APIs
 *
 * Mantiene 100% de compatibilidad hacia atrás.
 */

// Tipos
export type {
  CitiesResponse,
  CityRow,
  CountriesResponse,
  CountryRow,
  DonutItem,
  RegionRow,
  RegionsResponse,
  SimpleDonutResponse,
} from "./donut/types";

// Queries a GA4
export {
  queryCities,
  queryCountries,
  queryRegions,
  querySimpleDonut,
} from "./donut/queries";

// Request handlers
export {
  handleCitiesRequest,
  handleCountriesRequest,
  handleRegionsRequest,
  handleSimpleDonutRequest,
} from "./donut/handlers";
