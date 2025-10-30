"use client";

import DonutCard from "@/components/dashboard/DonutCard";
import { Laptop } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../../context/HeaderAnalyticsTimeContext";
import { DonutSectionSkeleton } from "../../skeletons";
import { CHART_HEIGHT } from "./constants";
import { ErrorState } from "./ErrorState";
import { useDevicesOsData } from "./useDevicesOsData";

export default function DevicesOsDonutSection() {
  const { mode, startISO, endISO, granularity } = useHeaderAnalyticsTimeframe();

  const start = mode === "range" ? startISO : undefined;
  const end = mode === "range" ? endISO : undefined;

  const { items, isLoading, error } = useDevicesOsData({
    start,
    end,
    granularity,
  });

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
      title="Usuarios por sistema operativo"
      centerTitle="Total"
      height={CHART_HEIGHT}
      Icon={Laptop}
      iconColor="text-huelva-primary"
      titleSize="xxs"
      variant="plain"
    />
  );
}
