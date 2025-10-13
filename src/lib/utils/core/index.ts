/**
 * Índice de utilidades Core (Núcleo)
 * Exporta funcionalidades centrales y transversales del sistema
 */

// HTTP y comunicación
export * from "./http";

// Cálculo de deltas
export * from "./delta";

// Manejo de imágenes
export * from "./images";

// Funcionalidades de sectores
export * from "./sector";

// Drilldown y navegación
export * from "./drilldown";

// Mapeo de granularidad
export * from "./granularityMapping";

// Políticas de ventana (usa importaciones específicas para evitar conflictos)
export * from "./windowPolicy";
