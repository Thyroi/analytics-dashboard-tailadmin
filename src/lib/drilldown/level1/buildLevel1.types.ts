// Types for Level 1 drilldown (strict, no any)

export interface TaxonomyTown {
  id: string; // canonical ID used internally (e.g., "almonte", "la_palma_del_condado")
  displayName: string; // UI label
  aliases: string[]; // raw variants expected from data
}

export interface TaxonomyCategory {
  id: string; // canonical ID used internally (e.g., "naturaleza", "fiestas_y_tradiciones")
  displayName: string; // UI label
  aliases: string[]; // raw variants expected from data
}

export interface SeriesPoint {
  time: string;
  value: number;
}

// Raw series keyed by full key (e.g., "root.naturaleza.almonte")
export interface RawSeriesByKey {
  [key: string]: SeriesPoint[];
}

export interface ChartSlice {
  id: string; // canonical id of matched entity, or "otros"
  label: string; // display label for slice
  value: number; // aggregated value for the slice
  rawToken?: string; // original raw token from data (e.g., "la palma del condado")
}

export interface OtrosDetailItem {
  key: string; // full original key (unmodified)
  series: SeriesPoint[];
}

export interface SublevelInfo {
  hasChildren: boolean;
}

export interface BuildLevel1Result {
  donutData: ChartSlice[];
  seriesBySlice: Record<string, SeriesPoint[]>; // aggregated series per slice id (for line charts)
  otrosDetail: OtrosDetailItem[];
  sublevelMap: Record<string, SublevelInfo>; // matched canonical id -> info
  total: number;
  warnings: string[]; // messages about tails not mapped or malformed keys
}

export interface BuildLevel1Params {
  scopeType: "category" | "town";
  scopeId: string; // raw token as appears in data (e.g., "naturaleza" | "la palma del condado")
  level1Data: RawSeriesByKey; // response of "root.<scopeId>.*"
  towns: TaxonomyTown[];
  categories: TaxonomyCategory[];
  sumStrategy?: "sum" | "last"; // default "sum"
  // Batch: single call with many patterns, returns a single record map
  fetchMany: (patterns: string[]) => Promise<RawSeriesByKey>;
  window?: { startTime: string; endTime: string; granularity: "d" | "w" | "m" };
  debug?: boolean; // enable debug logging
}
