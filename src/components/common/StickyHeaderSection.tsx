"use client";

import Header from "@/components/common/Header";
import RangeControls from "@/components/dashboard/RangeControls";
import type { Granularity } from "@/lib/types";
import { BarChart3 } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  mode: "granularity" | "range";
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  onGranularityChange: (g: Granularity) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
};

export default function StickyHeaderSection({
  title,
  subtitle,
  mode,
  granularity,
  startDate,
  endDate,
  onGranularityChange,
  onRangeChange,
  onClearRange,
}: Props) {
  return (
    <div className="sticky z-20 top-[var(--app-header-h,0px)] mb-3">
      <div
        className="
          flex items-center justify-between gap-3
          bg-[#f9fafb] dark:bg-[#160c0cbb]
          dark:supports-[backdrop-filter]:bg-[#0c1116]/70
          px-1 py-2
        "
      >
        <Header
          className="flex items-center h-full"
          title={title}
          subtitle={subtitle}
          Icon={BarChart3}
          iconColor="text-red-600"
        />

        <RangeControls
          mode={mode}
          granularity={granularity}
          onGranularityChange={onGranularityChange}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onRangeChange}
          onClearRange={onClearRange}
          className="mb-0"
        />
      </div>
    </div>
  );
}
