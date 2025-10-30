import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import type { Granularity, Mode } from "@/lib/types";

interface SectionHeaderProps {
  mode: Mode;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  onPickerDatesUpdate: (start: Date, end: Date) => void;
}

export function SectionHeader({
  mode,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onRangeChange,
  onClearRange,
  onPickerDatesUpdate,
}: SectionHeaderProps) {
  return (
    <StickyHeaderSection
      title="Analíticas por categoría"
      subtitle="Vista general del rendimiento y métrricas"
      mode={mode}
      granularity={granularity}
      onGranularityChange={onGranularityChange}
      startDate={startDate}
      endDate={endDate}
      onRangeChange={onRangeChange}
      onClearRange={onClearRange}
      onPickerDatesUpdate={onPickerDatesUpdate}
    />
  );
}
