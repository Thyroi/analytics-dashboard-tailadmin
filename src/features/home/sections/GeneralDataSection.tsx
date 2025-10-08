"use client";

import {
  HeaderAnalyticsTimeProvider,
  useHeaderAnalyticsTimeframe,
} from "@/features/analytics/context/HeaderAnalyticsTimeContext";
import StickyHeaderSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";
import GeneralDataRow from "@/features/home/generalSection/GeneralDataRow";

function InnerGeneralDataSection() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
  } = useHeaderAnalyticsTimeframe();
  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Datos generales"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      <GeneralDataRow
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
    </section>
  );
}

export default function GeneralDataSection() {
  return (
    <HeaderAnalyticsTimeProvider>
      <InnerGeneralDataSection />
    </HeaderAnalyticsTimeProvider>
  );
}
