/**
 * Exportaciones del módulo de chatbot
 * Solo componentes y servicios realmente utilizados
 */

// Componentes principales (solo los usados por la página principal)
export { default as CategoryDrilldownView } from "./components/CategoryDrilldownView";
export { default as ChatbotCategoriesSection } from "./components/ChatbotCategoriesSection";
export { default as ChatbotTownsSection } from "./components/ChatbotTownsSection";

// Servicios (solo tagAudit se usa)
export {
  clearCache as clearTagAuditCache,
  fetchTagAudit,
  PATTERNS,
  TagAuditError,
  type TagAuditParams,
} from "./services/tagAudit";

// Tipos
export * from "./types";
