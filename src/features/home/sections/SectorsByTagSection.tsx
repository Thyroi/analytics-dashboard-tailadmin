"use client";

import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import StickyHeaderSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";
import SectorsByTagSectionContent from "@/features/home/sectors/SectorsByTagSection";

function InnerSectorsByTagSection() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
  } = useTagTimeframe();
  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Sectores por categoría"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      <SectorsByTagSectionContent />
    </section>
  );
}

export default function SectorsByTagSection() {
  return (
    <TagTimeProvider>
      <InnerSectorsByTagSection />
    </TagTimeProvider>
  );
}
