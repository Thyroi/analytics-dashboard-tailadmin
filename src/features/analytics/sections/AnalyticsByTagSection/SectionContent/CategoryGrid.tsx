import SectorsGrid from "@/components/common/SectorsGrid";
import type { Granularity, SeriesPoint } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta/types";
import type { Level2Data } from "../types";

interface CategoryGridProps {
  gridKey: string;
  displayedIds: string[];
  calculatedGranularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  getDeltaPctFor: (id: string) => number | null;
  getDeltaArtifactFor: (id: string) => DeltaArtifact | null;
  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => Array<{ label: string; value: number }>;
  expandedId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  onSliceClick: (label: string) => void;
  isDeltaLoading: boolean;
  level2Data: Level2Data | undefined;
  startDate: Date;
  endDate: Date;
}

export function CategoryGrid({
  gridKey,
  displayedIds,
  calculatedGranularity,
  onGranularityChange,
  getDeltaPctFor,
  getDeltaArtifactFor,
  getSeriesFor,
  getDonutFor,
  expandedId,
  onOpen,
  onClose,
  onSliceClick,
  isDeltaLoading,
  level2Data,
  startDate,
  endDate,
}: CategoryGridProps) {
  return (
    <SectorsGrid
      key={gridKey}
      variant="detailed"
      mode="tag"
      ids={displayedIds}
      granularity={calculatedGranularity}
      onGranularityChange={onGranularityChange}
      getDeltaPctFor={getDeltaPctFor}
      getDeltaArtifactFor={getDeltaArtifactFor}
      getSeriesFor={getSeriesFor}
      getDonutFor={getDonutFor}
      expandedId={expandedId}
      onOpen={onOpen}
      onClose={onClose}
      onSliceClick={onSliceClick}
      isDeltaLoading={isDeltaLoading}
      level2Data={level2Data}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
