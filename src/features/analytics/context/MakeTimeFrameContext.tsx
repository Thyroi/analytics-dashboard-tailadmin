"use client";

import type { Granularity } from "@/lib/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/** Cálculo de rango por granularidad (terminando AYER).
 * - d → 1 día (ayer…ayer)
 * - w → 7 días terminando ayer
 * - m → 30 días terminando ayer
 * - y → 365 días terminando ayer
 *
 * OJO: esto es SOLO para el DatePicker/UX.
 * El "dayAsWeek" para gráficas lo maneja el servicio/endpoint.
 */
function calcRangeForGranularity(g: Granularity, now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)
  ); // ayer (UTC)
  const days = g === "d" ? 1 : g === "w" ? 7 : g === "m" ? 30 : 365;
  const start = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate() - (days - 1)
    )
  );
  return { start, end };
}

function toISO(d: Date): string {
  // yyyy-mm-dd (UTC)
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayUTC(): Date {
  const n = new Date();
  return new Date(
    Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() - 1)
  );
}

function clampAndOrderRange(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const maxEnd = yesterdayUTC();
  const s0 = new Date(Math.min(start.getTime(), end.getTime()));
  const e0 = new Date(Math.max(start.getTime(), end.getTime()));
  const e = e0 > maxEnd ? maxEnd : e0;
  const s = s0 > e ? e : s0;
  return { start: s, end: e };
}

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

export type TimeframeValue = State & {
  startISO: string;
  endISO: string;
} & Actions;

export function makeTimeframeContext(displayName: string) {
  const Ctx = createContext<TimeframeValue | null>(null);

  function Provider({
    children,
    defaultGranularity = "d" as Granularity,
  }: {
    children: React.ReactNode;
    defaultGranularity?: Granularity;
  }) {
    const initial = calcRangeForGranularity(defaultGranularity);
    const [state, setState] = useState<State>({
      mode: "granularity",
      granularity: defaultGranularity,
      startDate: initial.start,
      endDate: initial.end,
    });

    const setGranularity = useCallback((g: Granularity) => {
      const r = calcRangeForGranularity(g);
      setState({
        mode: "granularity",
        granularity: g,
        startDate: r.start,
        endDate: r.end,
      });
    }, []);

    const setRange = useCallback((start: Date, end: Date) => {
      const { start: s, end: e } = clampAndOrderRange(start, end);
      setState((st) => ({ ...st, mode: "range", startDate: s, endDate: e }));
    }, []);

    const clearRange = useCallback(() => {
      // Volver al rango calculado por la granularidad actual
      setState((s) => {
        const r = calcRangeForGranularity(s.granularity);
        return {
          ...s,
          mode: "granularity",
          startDate: r.start,
          endDate: r.end,
        };
      });
    }, []);

    const value: TimeframeValue = useMemo(() => {
      const startISO = toISO(state.startDate);
      const endISO = toISO(state.endDate);
      return {
        ...state,
        startISO,
        endISO,
        setGranularity,
        setRange,
        clearRange,
      };
    }, [state, setGranularity, setRange, clearRange]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useTimeframe(): TimeframeValue {
    const ctx = useContext(Ctx);
    if (!ctx)
      throw new Error(
        `useTimeframe must be used within <${displayName}Provider>`
      );
    return ctx;
  }

  Provider.displayName = `${displayName}Provider`;

  return { Provider, useTimeframe };
}
