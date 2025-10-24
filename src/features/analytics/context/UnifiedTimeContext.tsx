"use client";

import type { Granularity } from "@/lib/types";
import { addDaysUTC, todayUTC, toISO } from "@/lib/utils/time/datetime";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
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

  // Nuevos métodos para rangos calculados
  getCurrentPeriod: () => { start: string; end: string };
  getPreviousPeriod: () => { start: string; end: string };
  getCalculatedGranularity: () => Granularity;
  getDurationDays: () => number;
} & TimeframeActions;

/* ========= Shared Helpers ========= */
function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/**
 * Calcula el rango de fechas según el período seleccionado
 */
function calculateRangeForPeriod(period: "dia" | "semana" | "mes" | "ano"): {
  start: Date;
  end: Date;
} {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (period) {
    case "dia": {
      // Día: solo ayer
      return { start: yesterday, end: yesterday };
    }
    case "semana": {
      // Semana: últimos 7 días terminando ayer
      const start = new Date(yesterday);
      start.setDate(start.getDate() - 6); // 7 días incluyendo el final
      return { start, end: yesterday };
    }
    case "mes": {
      // Mes: últimos 30 días terminando ayer
      const start = new Date(yesterday);
      start.setDate(start.getDate() - 29); // 30 días incluyendo el final
      return { start, end: yesterday };
    }
    case "ano": {
      // Año: últimos 365 días terminando ayer
      const start = new Date(yesterday);
      start.setDate(start.getDate() - 364); // 365 días incluyendo el final
      return { start, end: yesterday };
    }
    default:
      return { start: yesterday, end: yesterday };
  }
}

/** Preset por granularidad, terminando AYER */
function presetForGranularity(g: Granularity) {
  // Mapear granularidad a período
  let period: "dia" | "semana" | "mes" | "ano";
  switch (g) {
    case "d":
      period = "dia";
      break;
    case "w":
      period = "semana";
      break;
    case "m":
      period = "mes";
      break;
    case "y":
      period = "ano";
      break;
    default:
      period = "dia";
  }

  return calculateRangeForPeriod(period);
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
      () => presetForGranularity(defaultGranularity).start
    );
    const [endDate, setEndDate] = useState<Date>(
      () => presetForGranularity(defaultGranularity).end
    );

    const setGranularity = useCallback((g: Granularity) => {
      const preset = presetForGranularity(g);
      setGranularityState(g);
      setStartDate(preset.start);
      setEndDate(preset.end);
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
      setStartDate(preset.start);
      setEndDate(preset.end);
      setMode("granularity");
    }, [granularity]);

    // Nuevos métodos para cálculos de rangos
    const getCurrentPeriod = useCallback(
      () => ({
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      }),
      [startDate, endDate]
    );

    const getPreviousPeriod = useCallback(() => {
      const current = getCurrentPeriod();
      try {
        const calculation = calculatePreviousPeriodAndGranularity(
          current.start,
          current.end
        );
        return calculation.prevRange;
      } catch {
        // Fallback: día anterior
        const fallbackDate = new Date(startDate);
        fallbackDate.setDate(fallbackDate.getDate() - 1);
        const fallbackStr = fallbackDate.toISOString().split("T")[0];
        return { start: fallbackStr, end: fallbackStr };
      }
    }, [getCurrentPeriod, startDate]);

    const getCalculatedGranularity = useCallback((): Granularity => {
      if (mode === "granularity") {
        // Para modo granularidad, usar EXACTAMENTE la granularidad que seleccionó el usuario
        // NO hacer correcciones automáticas - respetar la intención del usuario
        return granularity;
      }

      // Modo range: calcular automáticamente según duración
      const current = getCurrentPeriod();
      try {
        const calculation = calculatePreviousPeriodAndGranularity(
          current.start,
          current.end
        );
        return calculation.granularity;
      } catch {
        return "d"; // Fallback
      }
    }, [mode, granularity, getCurrentPeriod]);

    const getDurationDays = useCallback((): number => {
      const current = getCurrentPeriod();
      try {
        const calculation = calculatePreviousPeriodAndGranularity(
          current.start,
          current.end
        );
        return calculation.durationDays;
      } catch {
        return 1; // Fallback
      }
    }, [getCurrentPeriod]);

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
        getCurrentPeriod,
        getPreviousPeriod,
        getCalculatedGranularity,
        getDurationDays,
      }),
      [
        mode,
        granularity,
        startDate,
        endDate,
        setGranularity,
        setRange,
        clearRange,
        getCurrentPeriod,
        getPreviousPeriod,
        getCalculatedGranularity,
        getDurationDays,
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
