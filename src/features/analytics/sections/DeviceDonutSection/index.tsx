"use client";

import DonutCard from "@/components/dashboard/DonutCard";
import { MonitorSmartphone } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../../context/HeaderAnalyticsTimeContext";
import { DonutSectionSkeleton } from "../../skeletons";
import { CHART_HEIGHT } from "./constants";
import { ErrorState } from "./ErrorState";
import { useDeviceData } from "./useDeviceData";

export default function DeviceDonutSection() {
  const { mode, startISO, endISO, granularity } = useHeaderAnalyticsTimeframe();

  const start = mode === "range" ? startISO : undefined;
  const end = mode === "range" ? endISO : undefined;

  const { items, isLoading, error } = useDeviceData({ start, end, granularity });

  if (isLoading) {
    return <DonutSectionSkeleton />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <DonutCard
      className="card bg-analytics-gradient overflow-hidden p-6"
      items={items}
      title="Usuarios por dispositivo"
      centerTitle="Total"
      height={CHART_HEIGHT}
      Icon={MonitorSmartphone}
      titleSize="xxs"
      iconColor="text-huelva-primary"
      variant="plain"
    />
  );
}
