import type { SeriesPoint } from "@/lib/types";

// Datos vacíos seguros para pasar al panel mientras carga
export const EMPTY_SERIES: { current: SeriesPoint[]; previous: SeriesPoint[] } =
  {
    current: [],
    previous: [],
  };

export const EMPTY_KPIS = {
  current: {
    activeUsers: 0,
    userEngagementDuration: 0,
    newUsers: 0,
    eventCount: 0,
    sessions: 0,
    averageSessionDuration: 0,
    avgEngagementPerUser: 0,
    eventsPerSession: 0,
  },
  previous: {
    activeUsers: 0,
    userEngagementDuration: 0,
    newUsers: 0,
    eventCount: 0,
    sessions: 0,
    averageSessionDuration: 0,
    avgEngagementPerUser: 0,
    eventsPerSession: 0,
  },
  deltaPct: {
    activeUsers: 0,
    newUsers: 0,
    eventCount: 0,
    sessions: 0,
    averageSessionDuration: 0,
    avgEngagementPerUser: 0,
    eventsPerSession: 0,
  },
};

type LoadedUrlData = {
  loading: false;
  seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: typeof EMPTY_KPIS;
  operatingSystems: unknown[];
  devices: unknown[];
  countries: unknown[];
  deltaPct: number;
};

type UrlData = {
  loading: boolean;
} & Partial<Omit<LoadedUrlData, "loading">>;

/**
 * Función para determinar si los datos de URL están cargados
 * Guard de tipo: loaded si el objeto tiene la prop 'seriesAvgEngagement'
 */
export function isUrlDataLoaded(url: UrlData): url is LoadedUrlData {
  return (
    !url.loading && "seriesAvgEngagement" in url && !!url.seriesAvgEngagement
  );
}

/**
 * Extrae los datos seguros de URL o devuelve valores por defecto
 */
export function extractUrlData(url: UrlData) {
  const isLoaded = isUrlDataLoaded(url);

  return {
    seriesAvgEngagement: isLoaded ? url.seriesAvgEngagement : EMPTY_SERIES,
    kpis: isLoaded ? url.kpis : EMPTY_KPIS,
    operatingSystems: isLoaded ? url.operatingSystems : [],
    devices: isLoaded ? url.devices : [],
    countries: isLoaded ? url.countries : [],
    deltaPct: isLoaded ? url.deltaPct : 0,
  };
}
