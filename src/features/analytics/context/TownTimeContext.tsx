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

const TownTimeContext = createContext<TimeframeContextValue | null>(null);

/* ========= helpers ========= */
function toUTCDate(iso: string): Date {
  // Asegura medianoche UTC
  return new Date(`${iso}T00:00:00Z`);
}

function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/** Preset por granularidad, terminando AYER.
 *  Para g="d" usamos dayAsWeek=true (ventana de 7 días).
 *  OJO: deriveRangeEndingYesterday => { startTime, endTime }
 */
function presetForGranularity(g: Granularity) {
  const r = deriveRangeEndingYesterday(g, todayUTC(), g === "d");
  return { start: toUTCDate(r.startTime), end: toUTCDate(r.endTime) };
}

/* ========= provider ========= */

export function TownTimeProvider({ children }: { children: React.ReactNode }) {
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
    // Ordenar y clamp a AYER
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
    <TownTimeContext.Provider value={value}>
      {children}
    </TownTimeContext.Provider>
  );
}

export function useTownTimeframe(): TimeframeContextValue {
  const ctx = useContext(TownTimeContext);
  if (!ctx) {
    throw new Error("useTownTimeframe must be used within <TownTimeProvider>");
  }
  return ctx;
}
