import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { IconOrImage } from "@/lib/utils/core/images";
import SectorExpandedCardDetailed from "../../expanded/SectorExpandedCardDetailed";
import type { SectorsGridDetailedProps } from "../types";
import { EXPANDED_GRID_CLASSES } from "./constants";

interface ExpandedViewProps {
  id: string;
  expandedRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  deltaPct: number | null;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => DonutDatum[];
  handleClose: () => void;
  onSliceClick?: (label: string) => void;
  level2Data?: SectorsGridDetailedProps["level2Data"];
  expandedVariant: IconOrImage;
}

export function ExpandedView({
  id,
  expandedRef,
  title,
  deltaPct,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  getSeriesFor,
  getDonutFor,
  handleClose,
  onSliceClick,
  level2Data,
  expandedVariant,
}: ExpandedViewProps) {
  const s = getSeriesFor(id);
  const donutData = getDonutFor(id);

  return (
    <div
      key={`expanded-${id}`}
      ref={expandedRef}
      className={EXPANDED_GRID_CLASSES}
    >
      <SectorExpandedCardDetailed
        title={title}
        deltaPct={deltaPct ?? 0}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={() => {}}
        onClearRange={() => {}}
        current={s.current}
        previous={s.previous}
        donutData={donutData}
        onClose={handleClose}
        onSliceClick={onSliceClick}
        level2={level2Data}
        {...expandedVariant}
      />
    </div>
  );
}
