"use client";

import DonutCard from "@/components/dashboard/DonutCard";
import {
  colorizeOs,
  useDevicesOs,
} from "@/features/analytics/hooks/useDevicesOs";
import { Laptop } from "lucide-react";
import { useMemo } from "react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";
import { DonutSectionSkeleton } from "../skeletons";

const CHART_HEIGHT = 260;

type DonutItem = { label: string; value: number; color?: string };

export default function DevicesOsDonutSection() {
  const { mode, startISO, endISO, granularity } = useHeaderAnalyticsTimeframe();

  const start = mode === "range" ? startISO : undefined;
  const end = mode === "range" ? endISO : undefined;

  const { data, isLoading, error } = useDevicesOs({ start, end, granularity });

  const items: DonutItem[] = useMemo(
    () => colorizeOs(data?.items ?? []),
    [data?.items]
  );

  if (isLoading) {
    return <DonutSectionSkeleton />;
  }

  if (error) {
    return (
      <div
        className="card bg-analytics-gradient overflow-hidden text-sm text-red-500 flex items-center justify-center"
        style={{ height: CHART_HEIGHT }}
      >
        {error.message}
      </div>
    );
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
