"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  addMonthsUTC,
  toISO,
  todayUTC,
} from "@/lib/utils/datetime";

type Mode = "granularity" | "range";

type State = {
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
};

type Actions = {
  /** Cambiar granularidad y recalcular fechas (terminando AYER) */
  setGranularity: (g: Granularity) => void;
  /** Fijar rango manual y pasar a modo range (clamp a AYER) */
  setRange: (start: Date, end: Date) => void;
  /** Volver a granularidad y recalcular fechas según la última granularidad */
  clearRange: () => void;
};

export type HeaderAnalyticsTimeValue = State & {
  startISO: string;
  endISO: string;
} & Actions;

const Ctx = createContext<HeaderAnalyticsTimeValue | null>(null);

/* ===== helpers locales (sincronizadas con datetime.ts) ===== */

function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/** Devuelve un rango [start, end] terminando AYER para cada granularidad */
function calcRangeForGranularity(
  g: Granularity,
  end: Date = yesterdayUTC()
): { start: Date; end: Date } {
  if (g === "d") {
    // Un único día: ayer…ayer
    return { start: end, end };
  }
  if (g === "w") {
    // 7 días terminando ayer
    return { start: addDaysUTC(end, -6), end };
  }
  if (g === "m") {
    // 30 días terminando ayer
    return { start: addDaysUTC(end, -29), end };
  }
  // "y": 12 meses terminando ayer (para charts mensuales)
  return { start: addMonthsUTC(end, -11), end };
}

/** Ordena start/end y los limita para no ir al futuro (máximo AYER) */
function clampAndOrderRange(start: Date, end: Date): { start: Date; end: Date } {
  const maxEnd = yesterdayUTC();
  // ordenar
  const s0 = new Date(Math.min(start.getTime(), end.getTime()));
  const e0 = new Date(Math.max(start.getTime(), end.getTime()));
  // clamp a AYER
  const e = e0 > maxEnd ? maxEnd : e0;
  const s = s0 > e ? e : s0;
  return { start: s, end: e };
}

/* =================== Provider =================== */

export function HeaderAnalyticsTimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado inicial: Día (ayer…ayer)
  const initial = calcRangeForGranularity("d", yesterdayUTC());
  const [state, setState] = useState<State>({
    mode: "granularity",
    granularity: "d",
    startDate: initial.start,
    endDate: initial.end,
  });

  const setGranularity = useCallback((g: Granularity) => {
    const win = calcRangeForGranularity(g, yesterdayUTC());
    setState({
      mode: "granularity",
      granularity: g,
      startDate: win.start,
      endDate: win.end,
    });
  }, []);

  const setRange = useCallback((start: Date, end: Date) => {
    const { start: s, end: e } = clampAndOrderRange(start, end);
    setState((prev) => ({
      ...prev,
      mode: "range",
      startDate: s,
      endDate: e,
    }));
  }, []);

  const clearRange = useCallback(() => {
    setState((prev) => {
      const win = calcRangeForGranularity(prev.granularity, yesterdayUTC());
      return {
        mode: "granularity",
        granularity: prev.granularity,
        startDate: win.start,
        endDate: win.end,
      };
    });
  }, []);

  const value: HeaderAnalyticsTimeValue = useMemo(() => {
    return {
      ...state,
      startISO: toISO(state.startDate),
      endISO: toISO(state.endDate),
      setGranularity,
      setRange,
      clearRange,
    };
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
