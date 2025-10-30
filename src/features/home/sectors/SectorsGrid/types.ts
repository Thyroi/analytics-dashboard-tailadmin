import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta";

export type Mode = "tag" | "town";

export interface SectorsGridProps {
  mode: Mode;
  ids: string[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;

  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => DonutDatum[];
  getDeltaPctFor: (id: string) => number | null;
  getDeltaArtifactFor?: (id: string) => DeltaArtifact | null;

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  startDate?: Date;
  endDate?: Date;

  /** Loader en aro + delta oculto */
  isDeltaLoading?: boolean;
}
