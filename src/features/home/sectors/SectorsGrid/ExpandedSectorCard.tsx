import SectorExpandedCard from "../SectorExpandedCard";
import type { Granularity, SeriesPoint, DonutDatum } from "@/lib/types";
import { EXPANDED_CARD_SPAN } from "./constants";

interface ExpandedSectorCardProps {
  id: string;
  title: string;
  deltaPct: number | null;
  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => DonutDatum[];
  onClose: () => void;
  isTown: boolean;
  granularity: Granularity;
  variant: { imgSrc: string } | { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };
}

export function ExpandedSectorCard({
  id,
  title,
  deltaPct,
  getSeriesFor,
  getDonutFor,
  onClose,
  isTown,
  granularity,
  variant,
}: ExpandedSectorCardProps) {
  const s = getSeriesFor(id);
  const donutData = getDonutFor(id);

  return (
    <div className={EXPANDED_CARD_SPAN}>
      <SectorExpandedCard
        title={title}
        deltaPct={deltaPct ?? 0}
        current={s.current}
        previous={s.previous}
        donutData={donutData}
        onClose={onClose}
        isTown={isTown}
        granularity={granularity}
        {...variant}
      />
    </div>
  );
}
