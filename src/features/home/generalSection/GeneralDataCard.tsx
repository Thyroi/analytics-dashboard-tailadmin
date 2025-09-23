"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import GeneralDataCardView from "./GeneralDataCardView";

import { useHomeFilters } from "@/features/home/context/HomeFiltersContext";
import { useOverviewCompare } from "@/features/home/hooks/useOverviewCompare";

import type { Granularity, Metric, Mode, SliceName } from "@/lib/types";
import { parseISO, toISO } from "@/lib/utils/datetime";

type Props = {
  title?: string;
  metric?: Metric;                // "users" | "interactions" | "visits"
  defaultGranularity?: Granularity;
  className?: string;
};

export default function GeneralDataCard({
  title = "Usuarios totales",
  metric = "visits",
  defaultGranularity = "m",
  className = "",
}: Props) {
  const sliceName: SliceName = metric === "interactions" ? "interactions" : "users";
  const {
    users, interactions,
    applyUsersGranularityPreset,
    applyInteractionsGranularityPreset,
    setUsersRange, setInteractionsRange,
    resetUsers, resetInteractions,
  } = useHomeFilters();

  const slice = sliceName === "users" ? users : interactions;

  useEffect(() => {
    if (slice.granularity !== defaultGranularity) {
      if (sliceName === "users") {
        applyUsersGranularityPreset(defaultGranularity);
      } else {
        applyInteractionsGranularityPreset(defaultGranularity);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGranularity, sliceName]);

  const [mode, setMode] = useState<Mode>("granularity");
  const { kpiSeries, currentValue, deltaPct } = useOverviewCompare(sliceName, metric!);

  const startDate = useMemo(() => parseISO(slice.range.startTime), [slice.range.startTime]);
  const endDate = useMemo(() => parseISO(slice.range.endTime), [slice.range.endTime]);
  const handleGranularityChange = (g: Granularity) => {
    setMode("granularity");
    if (sliceName === "users") {
      applyUsersGranularityPreset(g);
    } else {
      applyInteractionsGranularityPreset(g);
    }
  };

  const handleRangeChange = (start: Date, end: Date) => {
    setMode("range");
    const r = { startTime: toISO(start), endTime: toISO(end) };
    if (sliceName === "users") {
      setUsersRange(r);
    } else {
      setInteractionsRange(r);
    }
  };

  const clearRange = () => {
    setMode("granularity");
    if (sliceName === "users") {
      applyUsersGranularityPreset(users.granularity);
      resetUsers();
    } else {
      applyInteractionsGranularityPreset(interactions.granularity);
      resetInteractions();
    }
  };

  return (
    <GeneralDataCardView
      title={title}
      icon={<Users className="h-5 w-5" />}
      value={currentValue}
      deltaPct={deltaPct}
      mode={mode}
      granularity={slice.granularity}
      onGranularityChange={handleGranularityChange}
      startDate={startDate}
      endDate={endDate}
      onRangeChange={handleRangeChange}
      onClearRange={clearRange}
      kpiSeries={kpiSeries ?? { bucket: slice.granularity, current: [], previous: [] }}
      className={className}
    />
  );
}
