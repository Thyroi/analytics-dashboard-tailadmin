import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type KpisBlock = {
  current: {
    activeUsers: number;
    userEngagementDuration: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
  previous: {
    activeUsers: number;
    userEngagementDuration: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
  deltaPct: {
    activeUsers: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
} | null;

export type UrlDetailsPanelProps = {
  path: string;
  loading: boolean;
  /** El service puede devolverla vacía mientras carga → la hacemos opcional y saneamos */
  seriesAvgEngagement?: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: KpisBlock;
  operatingSystems: DonutDatum[];
  devices: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
  granularity: Granularity;
  startISO?: string;
  endISO?: string;
  onClose?: () => void;
  activityName?: string;
  contextName?: string;
  contextKind?: "category" | "town";
};
