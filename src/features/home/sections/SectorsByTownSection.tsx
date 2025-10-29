"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import SectorsByTownSectionContent from "@/features/home/sectors/SectorsByTownSection";

function InnerSectorsByTownSection() {
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
  } = useTownTimeframe();

  // Usar granularidad calculada automáticamente según duración del rango
  const calculatedGranularity = getCalculatedGranularity();

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Sectores por municipio"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
        onPickerDatesUpdate={updatePickerDatesOnly}
      />
      <SectorsByTownSectionContent granularity={calculatedGranularity} />
    </section>
  );
}
export default function SectorsByTownSection() {
  return (
    <TownTimeProvider>
      <InnerSectorsByTownSection />
    </TownTimeProvider>
  );
}
