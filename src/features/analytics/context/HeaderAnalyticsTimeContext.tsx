"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Granularity } from "@/lib/types";

type Mode = "granularity" | "range";

type State = {
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
};

type Actions = {
  setGranularity: (g: Granularity) => void;
  setRange: (start: Date, end: Date) => void;
  clearRange: () => void;
};

export type HeaderAnalyticsTimeValue = State & {
  /** ISO yyyy-mm-dd útiles para servicios */
  startISO?: string;
  endISO?: string;
} & Actions;

const Ctx = createContext<HeaderAnalyticsTimeValue | null>(null);

function monthAgo(d: Date): Date {
  const n = new Date(d);
  n.setMonth(n.getMonth() - 1);
  return n;
}
function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function HeaderAnalyticsTimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({
    mode: "granularity",
    granularity: "d",
    startDate: monthAgo(new Date()),
    endDate: new Date(),
  });

  const setGranularity = useCallback((g: Granularity) => {
    setState((s) => ({ ...s, mode: "granularity", granularity: g }));
  }, []);

  const setRange = useCallback((start: Date, end: Date) => {
    setState((s) => ({ ...s, mode: "range", startDate: start, endDate: end }));
  }, []);

  const clearRange = useCallback(() => {
    setState((s) => ({ ...s, mode: "granularity" }));
  }, []);

  const value: HeaderAnalyticsTimeValue = useMemo(() => {
    const startISO = state.mode === "range" ? toISO(state.startDate) : undefined;
    const endISO = state.mode === "range" ? toISO(state.endDate) : undefined;
    return { ...state, startISO, endISO, setGranularity, setRange, clearRange };
  }, [state, setGranularity, setRange, clearRange]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHeaderAnalyticsTimeframe(): HeaderAnalyticsTimeValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useHeaderAnalyticsTimeframe must be used within <HeaderAnalyticsTimeProvider>"
    );
  }
  return ctx;
}
