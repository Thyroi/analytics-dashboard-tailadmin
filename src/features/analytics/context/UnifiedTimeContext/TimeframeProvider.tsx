import { toISO } from "@/lib/utils/time/datetime";
import type { Context } from "react";
import { useCallback, useMemo } from "react";
import {
  getCalculatedGranularity,
  getCurrentPeriod,
  getDurationDays,
  getPreviousPeriod,
} from "./periodCalculations";
import type { TimeframeContextValue, TimeframeProviderProps } from "./types";
import { useTimeframeActions } from "./useTimeframeActions";
import { useTimeframeState } from "./useTimeframeState";

type TimeframeProviderComponentProps = TimeframeProviderProps & {
  Context: Context<TimeframeContextValue | null>;
};

export function TimeframeProvider({
  children,
  defaultGranularity = "d",
  Context,
}: TimeframeProviderComponentProps) {
  const {
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
  } = useTimeframeState(defaultGranularity);

  const actions = useTimeframeActions({
    granularity,
    isGranularityLocked,
    setGranularityState,
    setStartDate,
    setEndDate,
    setMode,
    setIsGranularityLocked,
  });

  // Memoized period calculation methods
  const getCurrentPeriodCallback = useCallback(
    () => getCurrentPeriod(startDate, endDate),
    [startDate, endDate]
  );

  const getPreviousPeriodCallback = useCallback(
    () => getPreviousPeriod(startDate, endDate),
    [startDate, endDate]
  );

  const getCalculatedGranularityCallback = useCallback(
    () => getCalculatedGranularity(mode, granularity, startDate, endDate),
    [mode, granularity, startDate, endDate]
  );

  const getDurationDaysCallback = useCallback(
    () => getDurationDays(startDate, endDate),
    [startDate, endDate]
  );

  const contextValue = useMemo<TimeframeContextValue>(
    () => ({
      mode,
      granularity,
      startDate,
      endDate,
      isGranularityLocked,
      endISO: mode === "range" ? toISO(endDate) : undefined,
      startISO: toISO(startDate),
      ...actions,
      getCurrentPeriod: getCurrentPeriodCallback,
      getPreviousPeriod: getPreviousPeriodCallback,
      getCalculatedGranularity: getCalculatedGranularityCallback,
      getDurationDays: getDurationDaysCallback,
    }),
    [
      mode,
      granularity,
      startDate,
      endDate,
      isGranularityLocked,
      actions,
      getCurrentPeriodCallback,
      getPreviousPeriodCallback,
      getCalculatedGranularityCallback,
      getDurationDaysCallback,
    ]
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
