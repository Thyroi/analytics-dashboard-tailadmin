import type { SeriesPoint } from "@/lib/types";

export interface KPIsForUrl {
  current: {
    newUsers: number;
    eventsPerSession: number;
    avgEngagementPerUser: number; // seconds/user
    averageSessionDuration: number; // seconds
  };
  deltaPct: {
    newUsers: number;
    eventsPerSession: number;
    avgEngagementPerUser: number;
    averageSessionDuration: number;
  };
}

export interface KPIColumnWithTrendProps {
  /** Serie a graficar (líneas) */
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  /** KPIs ya calculados (por URL) */
  kpis: KPIsForUrl | null;
  /** Cargando (para skeleton) */
  loading?: boolean;
  /** Error opcional (para mostrar mensaje sencillo) */
  error?: string | null;
  /** Título encima del gráfico */
  title?: string;
  className?: string;
}
