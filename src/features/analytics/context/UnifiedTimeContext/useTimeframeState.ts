import type { Granularity } from "@/lib/types";
import { useState } from "react";
import { presetForGranularity } from "./dateUtils";
import type { Mode } from "./types";

export function useTimeframeState(defaultGranularity: Granularity) {
  const [mode, setMode] = useState<Mode>("granularity");
  const [granularity, setGranularityState] =
    useState<Granularity>(defaultGranularity);
  const [isGranularityLocked, setIsGranularityLocked] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    () => presetForGranularity(defaultGranularity).start
  );
  const [endDate, setEndDate] = useState<Date>(
    () => presetForGranularity(defaultGranularity).end
  );

  return {
    mode,
    setMode,
    granularity,
    setGranularityState,
    isGranularityLocked,
    setIsGranularityLocked,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };
}
