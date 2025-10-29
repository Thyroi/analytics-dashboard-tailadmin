import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import type { DonutDatum } from "@/lib/types";

type DonutSideProps = {
  donutData: DonutDatum[];
  onDonutSlice?: (label: string) => void;
  donutCenterLabel?: string;
  actionButtonTarget?: string;
  showActivityButton?: boolean;
};

export function DonutSide({
  donutData,
  onDonutSlice,
  donutCenterLabel,
  actionButtonTarget,
  showActivityButton,
}: DonutSideProps) {
  return (
    <div className="flex w-full">
      <DonutSection
        donutData={donutData}
        onSliceClick={onDonutSlice}
        centerLabel={donutCenterLabel}
        actionButtonTarget={actionButtonTarget}
        showActivityButton={showActivityButton}
      />
    </div>
  );
}
