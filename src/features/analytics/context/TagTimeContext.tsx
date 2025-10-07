"use client";

import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  deriveRangeEndingYesterday,
  todayUTC,
  toISO,
} from "@/lib/utils/datetime";
import React, {
  createContext,
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

type TimeframeContextValue = TimeframeState & {
  /** YYYY-MM-DD si mode === "range"; si no, undefined */
  endISO?: string;
} & TimeframeActions;

const TagTimeContext = createContext<TimeframeContextValue | null>(null);

/* ========= helpers ========= */
function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/** Preset por granularidad, terminando AYER (usa startTime/endTime del preset) */
function presetForGranularity(g: Granularity) {
  const r = deriveRangeEndingYesterday(g, todayUTC(), g === "d");
  return { start: toUTCDate(r.startTime), end: toUTCDate(r.endTime) };
}

/* ========= provider ========= */

export function TagTimeProvider({ children }: { children: React.ReactNode }) {
  const initial = presetForGranularity("d");
  const [state, setState] = useState<TimeframeState>({
    mode: "granularity",
    granularity: "d",
    startDate: initial.start,
    endDate: initial.end,
  });

  const setGranularity = useCallback((g: Granularity) => {
    const r = presetForGranularity(g);
    setState({
      mode: "granularity",
      granularity: g,
      startDate: r.start,
      endDate: r.end,
    });
  }, []);

  const setRange = useCallback((start: Date, end: Date) => {
    const maxEnd = yesterdayUTC();
    const s0 = new Date(Math.min(start.getTime(), end.getTime()));
    const e0 = new Date(Math.max(start.getTime(), end.getTime()));
    const e = e0 > maxEnd ? maxEnd : e0;
    const s = s0 > e ? e : s0;

    setState((curr) => ({
      ...curr,
      mode: "range",
      startDate: s,
      endDate: e,
    }));
  }, []);

  const clearRange = useCallback(() => {
    setState((s) => {
      const r = presetForGranularity(s.granularity);
      return {
        mode: "granularity",
        granularity: s.granularity,
        startDate: r.start,
        endDate: r.end,
      };
    });
  }, []);

  const value: TimeframeContextValue = useMemo(() => {
    const endISO = state.mode === "range" ? toISO(state.endDate) : undefined;
    return { ...state, endISO, setGranularity, setRange, clearRange };
  }, [state, setGranularity, setRange, clearRange]);

  return (
    <TagTimeContext.Provider value={value}>{children}</TagTimeContext.Provider>
  );
}

export function useTagTimeframe(): TimeframeContextValue {
  const ctx = useContext(TagTimeContext);
  if (!ctx) {
    throw new Error("useTagTimeframe must be used within <TagTimeProvider>");
  }
  return ctx;
}
