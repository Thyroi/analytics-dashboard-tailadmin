"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  HeaderAnalyticsTimeProvider,
  useHeaderAnalyticsTimeframe,
} from "@/features/analytics/context/HeaderAnalyticsTimeContext";
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
    updatePickerDatesOnly,
    getCalculatedGranularity,
  } = useHeaderAnalyticsTimeframe();

  // Usar granularidad calculada automáticamente según duración del rango
  const calculatedGranularity = getCalculatedGranularity();

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
        onPickerDatesUpdate={updatePickerDatesOnly}
      />
      <GeneralDataRow
        mode={mode}
        granularity={calculatedGranularity}
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
