"use client";

import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  deriveRangeEndingYesterday,
  todayUTC,
  toISO,
} from "@/lib/utils/time/datetime";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Mode = "granularity" | "range";

type TimeframeState = {
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
};

type TimeframeActions = {
  setGranularity: (g: Granularity) => void;
  setRange: (start: Date, end: Date) => void;
  clearRange: () => void;
};

export type TimeframeContextValue = TimeframeState & {
  /** YYYY-MM-DD si mode === "range"; si no, undefined */
  endISO?: string;
  /** YYYY-MM-DD siempre disponible para algunos contextos */
  startISO?: string;
} & TimeframeActions;

/* ========= Shared Helpers ========= */
function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/** Preset por granularidad, terminando AYER */
function presetForGranularity(g: Granularity) {
  const endTime = yesterdayUTC();
  const range = deriveRangeEndingYesterday(g);
  return {
    startDate: toUTCDate(range.start),
    endDate: endTime,
  };
}

/* ========= Factory Function ========= */
export function createTimeContext(contextName: string) {
  const Context = createContext<TimeframeContextValue | null>(null);
  Context.displayName = `${contextName}TimeContext`;

  const Provider = ({
    children,
    defaultGranularity = "d" as Granularity,
  }: {
    children: ReactNode;
    defaultGranularity?: Granularity;
  }) => {
    const [mode, setMode] = useState<Mode>("granularity");
    const [granularity, setGranularityState] =
      useState<Granularity>(defaultGranularity);
    const [startDate, setStartDate] = useState<Date>(
      () => presetForGranularity(defaultGranularity).startDate
    );
    const [endDate, setEndDate] = useState<Date>(
      () => presetForGranularity(defaultGranularity).endDate
    );

    const setGranularity = useCallback((g: Granularity) => {
      const preset = presetForGranularity(g);
      setGranularityState(g);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate);
      setMode("granularity");
    }, []);

    const setRange = useCallback((start: Date, end: Date) => {
      // Clamp end to yesterday
      const yesterday = yesterdayUTC();
      const clampedEnd = end > yesterday ? yesterday : end;
      const clampedStart = start > clampedEnd ? clampedEnd : start;

      setStartDate(clampedStart);
      setEndDate(clampedEnd);
      setMode("range");
    }, []);

    const clearRange = useCallback(() => {
      const preset = presetForGranularity(granularity);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate);
      setMode("granularity");
    }, [granularity]);

    const contextValue = useMemo<TimeframeContextValue>(
      () => ({
        mode,
        granularity,
        startDate,
        endDate,
        endISO: mode === "range" ? toISO(endDate) : undefined,
        startISO: toISO(startDate), // Always available for some contexts
        setGranularity,
        setRange,
        clearRange,
      }),
      [
        mode,
        granularity,
        startDate,
        endDate,
        setGranularity,
        setRange,
        clearRange,
      ]
    );

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
  };

  const useTimeframe = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(
        `use${contextName}Timeframe must be used within ${contextName}TimeProvider`
      );
    }
    return context;
  };

  return {
    Provider,
    useTimeframe,
    Context,
  };
}

/* ========= Specific Context Instances ========= */

// Tag Analytics Context
export const {
  Provider: TagTimeProvider,
  useTimeframe: useTagTimeframe,
  Context: TagTimeContext,
} = createTimeContext("Tag");

// Town Analytics Context
export const {
  Provider: TownTimeProvider,
  useTimeframe: useTownTimeframe,
  Context: TownTimeContext,
} = createTimeContext("Town");

// Header Analytics Context (with startISO always available)
export const {
  Provider: HeaderAnalyticsTimeProvider,
  useTimeframe: useHeaderAnalyticsTimeframe,
  Context: HeaderAnalyticsTimeContext,
} = createTimeContext("HeaderAnalytics");

// General Timeframe Context
export const {
  Provider: TimeframeProvider,
  useTimeframe: useTimeframe,
  Context: TimeframeContext,
} = createTimeContext("General");
