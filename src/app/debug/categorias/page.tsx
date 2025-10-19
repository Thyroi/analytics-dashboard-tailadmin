"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { DebugCategoriesSection as DebugCategoriesSectionContent } from "@/features/home/debug/DebugCategoriesSection";

function InnerDebugCategoriesSection() {
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
        title="🔧 Debug: Sectores por Categoría"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      <DebugCategoriesSectionContent granularity={granularity} />
    </section>
  );
}

export default function DebugCategoriesPage() {
  return (
    <TagTimeProvider>
      <InnerDebugCategoriesSection />
    </TagTimeProvider>
  );
}
