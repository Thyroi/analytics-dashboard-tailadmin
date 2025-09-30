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
  /** Devuelve YYYY-MM-DD si mode === "range", en otro caso undefined */
  endISO?: string;
} & TimeframeActions;

const TagTimeContext = createContext<TimeframeContextValue | null>(null);

function monthAgo(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - 1);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function TagTimeProvider({ children }: { children: React.ReactNode }) {
  // Defaults seguros: granularidad por defecto "m", rango último mes (sin activarlo)
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

  return <TagTimeContext.Provider value={value}>{children}</TagTimeContext.Provider>;
}

export function useTagTimeframe(): TimeframeContextValue {
  const ctx = useContext(TagTimeContext);
  if (!ctx) {
    throw new Error("useTagTimeframe must be used within <TagTimeProvider>");
  }
  return ctx;
}
