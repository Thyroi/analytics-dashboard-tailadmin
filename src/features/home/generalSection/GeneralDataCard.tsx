"use client";

import useOverviewCompare from "@/features/home/hooks/useOverviewCompare";
import type { Granularity, Metric, Mode, SliceName } from "@/lib/types";
import { Users } from "lucide-react";
import GeneralDataCardView from "./GeneralDataCardView";

type Props = {
  title?: string;
  metric?: Metric;
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  onGranularityChange: (g: Granularity) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  className?: string;
};


export default function GeneralDataCard({
  title = "Usuarios totales",
  metric = "visits",
  mode,
  granularity,
  startDate,
  endDate,
  onGranularityChange,
  onRangeChange,
  onClearRange,
  className = "",
}: Props) {
  const sliceName: SliceName = metric === "interactions" ? "interactions" : "users";
  const startTime = startDate.toISOString().split("T")[0];
  const endTime = endDate.toISOString().split("T")[0];
  const { kpiSeries, currentValue, deltaPct } = useOverviewCompare(sliceName, metric!, granularity, startTime, endTime);

  return (
    <GeneralDataCardView
      title={title}
      icon={<Users className="h-5 w-5" />}
      value={currentValue}
      deltaPct={deltaPct}
      mode={mode}
      granularity={granularity}
      onGranularityChange={onGranularityChange}
      startDate={startDate}
      endDate={endDate}
      onRangeChange={onRangeChange}
      onClearRange={onClearRange}
      kpiSeries={kpiSeries ?? { bucket: granularity, current: [], previous: [] }}
      className={className}
    />
  );
}
