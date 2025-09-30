"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Granularity } from "@/lib/types";

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
  endISO?: string;
} & TimeframeActions;

const TownTimeContext = createContext<TimeframeContextValue | null>(null);

function monthAgo(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - 1);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function TownTimeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimeframeState>({
    mode: "granularity",
    granularity: "d",
    startDate: monthAgo(new Date()),
    endDate: new Date(),
  });

  const setGranularity = useCallback((g: Granularity) => {
    setState((s) => ({ ...s, mode: "granularity", granularity: g }));
  }, []);

  const setRange = useCallback((start: Date, end: Date) => {
    setState((s) => ({
      ...s,
      mode: "range",
      startDate: start,
      endDate: end,
    }));
  }, []);

  const clearRange = useCallback(() => {
    setState((s) => ({ ...s, mode: "granularity" }));
  }, []);

  const value: TimeframeContextValue = useMemo(() => {
    const endISO = state.mode === "range" ? toISODate(state.endDate) : undefined;
    return { ...state, endISO, setGranularity, setRange, clearRange };
  }, [state, setGranularity, setRange, clearRange]);

  return <TownTimeContext.Provider value={value}>{children}</TownTimeContext.Provider>;
}

export function useTownTimeframe(): TimeframeContextValue {
  const ctx = useContext(TownTimeContext);
  if (!ctx) {
    throw new Error("useTownTimeframe must be used within <TownTimeProvider>");
  }
  return ctx;
}
