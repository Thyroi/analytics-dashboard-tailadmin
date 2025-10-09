/**
 * Exportaciones del módulo de chatbot
 * Arquitectura drill-down completa
 */

// Componentes principales
export { default as ChatbotByTagView } from "./components/ChatbotByTagView";
export { default as ChatbotCard } from "./components/ChatbotCard";
export { default as ChatbotCardSkeleton } from "./components/ChatbotCardSkeleton";
export { default as ChatbotDrilldownPanel } from "./components/ChatbotDrilldownPanel";
export { default as ChatbotDrilldownSkeleton } from "./components/ChatbotDrilldownSkeleton";

// Hooks
export { useChatbotByTag, useChatbotDrilldown } from "./hooks/useChatbotByTag";

// Servicios
export { getCategoriesTotals } from "./services/categoriesTotals";
export {
  clearCache as clearTagAuditCache,
  fetchTagAudit,
  PATTERNS,
  TagAuditError,
  type TagAuditParams,
} from "./services/tagAudit";
export { getTopCategories } from "./services/topCategories";
export { getTownCategoryDrilldown } from "./services/townCategoryDrilldown";
export { getTownDetailsChatbot } from "./services/townDetailsChatbot";
export { getTownsTotals } from "./services/townsTotals";
export { getTownsTotalsChatbot } from "./services/townsTotalsChatbot";

// Utilidades
// export * from "./utils/aggregation"; // Temporalmente comentado

// Tipos
export * from "./types";
