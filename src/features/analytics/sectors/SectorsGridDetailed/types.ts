import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type Mode = "tag" | "town";

export type SectorsGridDetailedProps = {
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

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  onSliceClick?: (label: string) => void;

  startDate?: Date;
  endDate?: Date;

  level2Data?: {
    townId: TownId;
    categoryId: CategoryId;
    granularity: Granularity;
    endISO?: string;
  };

  isDeltaLoading?: boolean;
};
