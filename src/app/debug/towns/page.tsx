"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { DebugTownsSection } from "@/features/home/debug/DebugTownsSection";

function InnerDebugTownsSection() {
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
        title="🔧 Debug: Sectores por Pueblo"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      <DebugTownsSection granularity={granularity} />
    </section>
  );
}

export default function DebugTownsPage() {
  return (
    <TagTimeProvider>
      <InnerDebugTownsSection />
    </TagTimeProvider>
  );
}
