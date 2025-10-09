/**
 * Tipos para la vista Chatbot según especificaciones del prompt maestro
 */

export type Granularity = "d" | "w" | "m" | "y";

export type ComparisonMode = "toDate" | "fullPeriod";

export type ViewMode = "byCategory" | "byTown";

// Respuesta de la API de auditoría
export type TagAuditResponse = {
  code: number;
  output: Record<string, Array<{ time: string; value: number }>>;
};

// Datos de una tarjeta
export type ChatbotCardData = {
  id: string;
  label: string;
  pattern: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPct: number | null;
};

// Datos para drill-down
export type DrilldownData = {
  id: string;
  label: string;
  pattern: string;
  currentSeries: Array<{ time: string; value: number }>;
  previousSeries: Array<{ time: string; value: number }>;
  donutData: Array<{ label: string; value: number; color?: string }>;
  currentTotal: number;
  prevTotal: number;
};

// Configuración de período
export type PeriodConfig = {
  granularity: Granularity;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  apiGranularity: Granularity;
  apiStartTime: string;
  apiEndTime: string;
};

// Props principales del componente
export type ChatbotByTagProps = {
  mode: ViewMode;
  categories?: string[];
  towns?: string[];
  comparisonMode?: ComparisonMode;
  onCardSelect?: (item: {
    id: string;
    type: "category" | "town";
    label: string;
    period: PeriodConfig;
  }) => void;
};

// Estados de la UI
export type UIState = "idle" | "loading" | "success" | "empty" | "error";

// Configuración de tiempo con TZ America/Bogota
export const CHATBOT_TIMEZONE = "America/Bogota";

// Constantes para patterns
export const PATTERN_TEMPLATES = {
  categoryTotal: (category: string) => `root.*.${category}.*`,
  categoryByTown: (category: string) => `root.*.${category}.*`,
  townTotal: (town: string) => `root.${town}.*`,
  townByCategory: (town: string) => `root.${town}.*`,
} as const;
