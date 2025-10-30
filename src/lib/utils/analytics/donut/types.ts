/**
 * Tipos TypeScript para respuestas de donuts y geografía
 */

export type DonutItem = {
  label: string;
  value: number;
  color?: string;
};

export type SimpleDonutResponse = {
  items: DonutItem[];
  range: { start: string; end: string };
  property: string;
  total: number;
};

export type CountryRow = {
  code: string | null; // ISO-2 o null para Unknown
  country: string;
  customers: number; // activeUsers
  pct: number; // % sobre total global
};

export type CountriesResponse = {
  range: { start: string; end: string };
  property: string;
  total: number;
  rows: CountryRow[];
};

export type RegionRow = {
  region: string;
  code?: string | null;
  customers: number;
  pct: number; // % del total del país
};

export type RegionsResponse = {
  range: { start: string; end: string };
  property: string;
  country: { code: string; name?: string | null };
  total: number;
  rows: RegionRow[];
};

export type CityRow = {
  city: string;
  customers: number;
  pct: number; // % del total de la región
};

export type CitiesResponse = {
  range: { start: string; end: string };
  property: string;
  country: { code: string; name?: string | null };
  region: string;
  total: number;
  rows: CityRow[];
};
