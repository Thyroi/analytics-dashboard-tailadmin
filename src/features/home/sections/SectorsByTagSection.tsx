"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
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
    updatePickerDatesOnly,
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
        onPickerDatesUpdate={updatePickerDatesOnly}
      />
      <SectorsByTagSectionContent granularity={granularity} />
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
