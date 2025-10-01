import type { MapMarker } from "@/components/charts/WorldBubbleMap";

export type CityView = {
  name: string;
  users: number;
  /** 0..100 para ancho de barra (con 1 decimal ya calculado) */
  pctNum: number;
  /** "xx.x" para etiqueta */
  pctLabel: string;
};

export type RegionView = {
  name: string;
  users: number;
  pctNum: number;
  pctLabel: string;
  isOpen: boolean;
  /** Estados de carga/errores del nivel ciudades (opcional) */
  citiesLoading?: boolean;
  citiesError?: string | null;
  cities?: CityView[];
};

export type CountryView = {
  code: string; // ISO-2
  name: string;
  users: number;
  pctNum: number;
  pctLabel: string;
  isOpen: boolean;
  /** Estados de carga/errores del nivel regiones (opcional) */
  regionsLoading?: boolean;
  regionsError?: string | null;
  regions?: RegionView[];
};

export type CustomersDemographicsProps = {
  title?: string;
  subtitle?: string;
  markers: MapMarker[];
  countries: CountryView[]; // ya con flags de apertura/carga/datos
  mapHeight?: number;
  /** Callbacks de interacción */
  onToggleCountry: (countryCode: string) => void;
  onToggleRegion: (countryCode: string, regionName: string) => void;
  className?: string;
};
