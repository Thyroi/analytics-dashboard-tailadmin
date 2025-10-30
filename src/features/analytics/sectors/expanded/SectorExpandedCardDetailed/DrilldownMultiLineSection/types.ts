import type { Granularity } from "@/lib/types";

export type SubSeries = { name: string; data: number[] };

export interface DrilldownMultiLineSectionProps {
  xLabels: string[];
  seriesBySub: SubSeries[];
  loading?: boolean;
  height?: number | string;
  maxSeries?: number;
  smooth?: boolean;
  className?: string;
  emptyHint?: string;
  /** Mapa de colores por nombre de serie para consistencia visual */
  colorsByName?: Record<string, string>;
  /** Granularidad para formatear el eje X correctamente */
  granularity?: Granularity;
}
