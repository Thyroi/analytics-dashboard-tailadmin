/**
 * Índice de utilidades de Datos y Gráficos
 * Exporta todas las funcionalidades relacionadas con procesamiento de datos y series
 */

// Funciones principales para gráficos y series
export * from "./charts";

// Agregación de categorías
export * from "./aggregateCategories";

// === Módulos modularizados (ex-seriesAndDonuts) ===
// Types
export type { GA4Row } from "./types";

// Parsers
export { parseGA4Date } from "./parsers";

// Time axis generation
export { generateTimeAxis } from "./timeAxis";

// Series mappers
export { mapToTemporalSeries } from "./seriesMappers";

// Series builders
export { buildTimeSeriesForCategory } from "./seriesForCategory";
export { buildTimeSeriesForTown } from "./seriesForTown";

// Donut builders
export { buildTownsDonutForCategory } from "./donutForCategoryTowns";
export { buildCategoriesDonutForTown } from "./donutForTownCategories";
export {
  buildUrlsDonutForCategoryTown,
  buildUrlsDonutForTownCategory,
} from "./donutForUrls";

// Formatters
export { buildSeriesAndDonutFocused, formatSeries } from "./formatters";
