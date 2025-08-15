// Tipos compartidos por Analytics (front + API)

export type ChartSeries = { name: string; data: number[] };

//----------------- KPI Totales y Payload---------------------
export type KpiTotals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
};

export type KpiPayload = {
  current: KpiTotals;
  previous: KpiTotals;
  deltaPct: {
    activeUsers: number | null;
    engagedSessions: number | null;
    eventCount: number | null;
  };
};

export function isKpiPayload(x: unknown): x is KpiPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.current === "object" &&
    typeof o.previous === "object" &&
    typeof o.deltaPct === "object"
  );
}

// ---------- User Acquisition --------------------------------

export type AcquisitionRangePayload = {
  categoriesISO: string[];
  categoriesLabels: string[];
  channels: string[];
  series: ChartSeries[];
  totalSeries: ChartSeries;
};

// ------------------------------------------------------------

export type SingleMetricRangePayload = {
  categoriesISO: string[];      // YYYY-MM-DD
  categoriesLabels: string[];   // Etiquetas "07 ago", "12 sep", etc.
  series: { name: string; data: number[] };
};

// ------------------------------------------------------------

export type DevicesOsPayload = {
  labels: string[];
  values: number[];
};

// ------------------------------------------------------------

export type MultiSeriesCategoriesPayload = {
  categories: string[];
  series: ChartSeries[];
};

// ------------------------------------------------------------

export type CountryRow = {
  country: string;
  code: string;      // ISO-3166-1 alpha-2 (p. ej. "US", "ES")
  customers: number;
  pct: number;       // 0..100 redondeado
};

export type CountriesPayload = {
  total: number;
  rows: CountryRow[];
};

