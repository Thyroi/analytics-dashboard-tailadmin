import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import type { Granularity, Mode } from "@/lib/types";
import { SECTION_SUBTITLE, SECTION_TITLE } from "./constants";

interface SectionHeaderProps {
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  onGranularityChange: (g: Granularity) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  onPickerDatesUpdate: (start: Date, end: Date) => void;
}

export function SectionHeader({
  mode,
  granularity,
  startDate,
  endDate,
  onGranularityChange,
  onRangeChange,
  onClearRange,
  onPickerDatesUpdate,
}: SectionHeaderProps) {
  return (
    <StickyHeaderSection
      title={SECTION_TITLE}
      subtitle={SECTION_SUBTITLE}
      mode={mode}
      granularity={granularity}
      startDate={startDate}
      endDate={endDate}
      onGranularityChange={onGranularityChange}
      onRangeChange={onRangeChange}
      onClearRange={onClearRange}
      onPickerDatesUpdate={onPickerDatesUpdate}
    />
  );
}
