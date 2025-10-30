import { useMemo } from "react";
import { GridItem } from "./GridItem";
import type { SectorsGridDetailedProps } from "./types";
import { getOrderedIds } from "./utils";

const ROW_H = 260;

type GridLayoutProps = SectorsGridDetailedProps & {
  expandedId: string | null;
  expandedRef: React.RefObject<HTMLDivElement | null>;
  handleOpen: (id: string) => void;
  handleClose: () => void;
};

export function GridLayout({
  mode,
  ids,
  granularity,
  onGranularityChange,
  getSeriesFor,
  getDonutFor,
  getDeltaPctFor,
  expandedId,
  expandedRef,
  handleOpen,
  handleClose,
  onSliceClick,
  startDate,
  endDate,
  level2Data,
  isDeltaLoading = false,
}: GridLayoutProps) {
  const orderedIds = useMemo(() => getOrderedIds(mode, ids), [mode, ids]);

  return (
    <div
      className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
    >
      {orderedIds.map((id) => (
        <GridItem
          key={id}
          id={id}
          mode={mode}
          expandedId={expandedId}
          expandedRef={expandedRef}
          granularity={granularity}
          onGranularityChange={onGranularityChange}
          getSeriesFor={getSeriesFor}
          getDonutFor={getDonutFor}
          getDeltaPctFor={getDeltaPctFor}
          handleOpen={handleOpen}
          handleClose={handleClose}
          onSliceClick={onSliceClick}
          startDate={startDate}
          endDate={endDate}
          level2Data={level2Data}
          isDeltaLoading={isDeltaLoading}
        />
      ))}
    </div>
  );
}
