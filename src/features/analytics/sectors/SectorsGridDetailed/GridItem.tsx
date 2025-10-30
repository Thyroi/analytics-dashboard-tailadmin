import DeltaCard from "@/components/common/DeltaCard";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { IconOrImage } from "@/lib/utils/core/images";
import { sectorIconSrc, sectorTitle } from "@/lib/utils/core/sector";
import { MapPinIcon } from "@heroicons/react/24/solid";
import SectorExpandedCardDetailed from "../expanded/SectorExpandedCardDetailed";
import type { Mode, SectorsGridDetailedProps } from "./types";
import { extractImageSrc } from "./utils";

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

const ROW_H = 260;

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
  const title = sectorTitle(mode, id);
  const iconCandidate = sectorIconSrc(mode, id);
  const imgSrcStr = extractImageSrc(iconCandidate);
  const isTown = mode === "town";
  const now = new Date();

  const expandedVariant: IconOrImage = imgSrcStr
    ? { imgSrc: imgSrcStr }
    : {
        Icon: MapPinIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>,
      };

  const deltaPct = getDeltaPctFor(id);

  if (expandedId === id) {
    const s = getSeriesFor(id);
    const donutData = getDonutFor(id);
    return (
      <div
        key={`expanded-${id}`}
        ref={expandedRef}
        className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-2 scroll-mt-24"
      >
        <SectorExpandedCardDetailed
          title={title}
          deltaPct={deltaPct ?? 0}
          granularity={granularity}
          onGranularityChange={onGranularityChange}
          startDate={startDate ?? now}
          endDate={endDate ?? now}
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

  return (
    <div key={id} className="row-span-1">
      <DeltaCard
        title={title}
        deltaPct={deltaPct}
        height={ROW_H}
        ringSize={96}
        ringThickness={8}
        expanded={false}
        onClick={() => handleOpen(id)}
        className="h-full"
        isTown={isTown}
        loading={isDeltaLoading}
        {...(imgSrcStr
          ? { imgSrc: imgSrcStr }
          : {
              Icon: MapPinIcon as React.ComponentType<
                React.SVGProps<SVGSVGElement>
              >,
            })}
      />
    </div>
  );
}
