"use client";

import React from "react";
import GeneralDataHeader from "./GeneralDataHeader";
import GeneralDataBody from "./GeneralDataBody";
import type { Granularity, KPISeries, Mode } from "@/lib/types";

type Props = {
  title: string;
  icon?: React.ReactNode;
  value: number;
  deltaPct: number;
  mode: Mode;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;

  kpiSeries: KPISeries;
  className?: string;
};

export default function GeneralDataCardView({
  title,
  icon,
  value,
  deltaPct,
  mode,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onRangeChange,
  onClearRange,
  kpiSeries,
  className = "",
}: Props) {
  return (
    <div
      className={`w-full rounded-xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-black/5 overflow-hidden ${className}`}
    >
      <GeneralDataHeader title={title} value={value} deltaPct={deltaPct} icon={icon} />

      <GeneralDataBody
        mode={mode}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
        onClearRange={onClearRange}
        kpiSeries={kpiSeries}
      />
    </div>
  );
}
