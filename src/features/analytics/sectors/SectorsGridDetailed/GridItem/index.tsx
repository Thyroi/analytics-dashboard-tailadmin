import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { Mode, SectorsGridDetailedProps } from "../types";
import { CollapsedView } from "./CollapsedView";
import { ExpandedView } from "./ExpandedView";
import { useSectorMetadata } from "./useSectorMetadata";

type GridItemProps = {
  id: string;
  mode: Mode;
  expandedId: string | null;
  expandedRef: React.RefObject<HTMLDivElement | null>;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => DonutDatum[];
  getDeltaPctFor: (id: string) => number | null;
  handleOpen: (id: string) => void;
  handleClose: () => void;
  onSliceClick?: (label: string) => void;
  startDate?: Date;
  endDate?: Date;
  level2Data?: SectorsGridDetailedProps["level2Data"];
  isDeltaLoading: boolean;
};

export function GridItem({
  id,
  mode,
  expandedId,
  expandedRef,
  granularity,
  onGranularityChange,
  getSeriesFor,
  getDonutFor,
  getDeltaPctFor,
  handleOpen,
  handleClose,
  onSliceClick,
  startDate,
  endDate,
  level2Data,
  isDeltaLoading,
}: GridItemProps) {
  const { title, isTown, expandedVariant, collapsedVariant } =
    useSectorMetadata(mode, id);

  const now = new Date();
  const deltaPct = getDeltaPctFor(id);

  if (expandedId === id) {
    return (
      <ExpandedView
        id={id}
        expandedRef={expandedRef}
        title={title}
        deltaPct={deltaPct}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate ?? now}
        endDate={endDate ?? now}
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        handleClose={handleClose}
        onSliceClick={onSliceClick}
        level2Data={level2Data}
        expandedVariant={expandedVariant}
      />
    );
  }

  return (
    <CollapsedView
      id={id}
      title={title}
      deltaPct={deltaPct}
      isTown={isTown}
      isDeltaLoading={isDeltaLoading}
      handleOpen={handleOpen}
      collapsedVariant={collapsedVariant}
    />
  );
}
