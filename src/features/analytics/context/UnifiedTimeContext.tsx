"use client";

import type { Granularity } from "@/lib/types";
import { addDaysUTC, todayUTC, toISO } from "@/lib/utils/time/datetime";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { getWindowGranularityFromRange } from "@/lib/utils/time/windowGranularity";
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
  /** Lock granularity: Si true, el usuario forzó granularidad y no se debe recalcular automáticamente */
  isGranularityLocked: boolean;
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
 * Calcula el rango de fechas según el período seleccionado (UTC)
 *
 * ⚠️ Migrado a UTC - Reemplaza new Date() y .setDate() por addDaysUTC()
 */
function calculateRangeForPeriod(period: "dia" | "semana" | "mes" | "ano"): {
  start: Date;
  end: Date;
} {
  const yesterday = yesterdayUTC();

  switch (period) {
    case "dia": {
      // Día: solo ayer
      return { start: yesterday, end: yesterday };
    }
    case "semana": {
      // Semana: últimos 7 días terminando ayer
      const start = addDaysUTC(yesterday, -6); // 7 días incluyendo el final
      return { start, end: yesterday };
    }
    case "mes": {
      // Mes: últimos 30 días terminando ayer
      const start = addDaysUTC(yesterday, -29); // 30 días incluyendo el final
      return { start, end: yesterday };
    }
    case "ano": {
      // Año: últimos 365 días terminando ayer
      const start = addDaysUTC(yesterday, -364); // 365 días incluyendo el final
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
    const [isGranularityLocked, setIsGranularityLocked] = useState(false);
    const [startDate, setStartDate] = useState<Date>(
      () => presetForGranularity(defaultGranularity).start
    );
    const [endDate, setEndDate] = useState<Date>(
      () => presetForGranularity(defaultGranularity).end
    );

    /**
     * setGranularity: Usuario fuerza una granularidad específica
     *
     * POLÍTICA:
     * - Activa LOCK de granularidad (no recalcular automáticamente)
     * - Aplica preset de fechas según granularidad
     * - Cambia a modo "granularity"
     */
    const setGranularity = useCallback((g: Granularity) => {
      const preset = presetForGranularity(g);
      setGranularityState(g);
      setStartDate(preset.start);
      setEndDate(preset.end);
      setMode("granularity");
      setIsGranularityLocked(true); // LOCK: Usuario forzó granularidad
    }, []);

    /**
     * setRange: Usuario selecciona rango custom en DatePicker
     *
     * POLÍTICA:
     * - DatePicker ya clampó end a yesterdayUTC() (NO hacer clamp adicional)
     * - Si lock=false → recalcular windowGranularity automáticamente
     * - Si lock=true → mantener granularidad del usuario
     * - Cambia a modo "range"
     */
    const setRange = useCallback(
      (start: Date, end: Date) => {
        // NO CLAMPAR AQUÍ - DatePicker ya lo hizo
        // Confiar en las fechas que vienen del DatePicker
        setStartDate(start);
        setEndDate(end);
        setMode("range");

        // Si granularidad NO está locked, recalcular automáticamente por duración
        if (!isGranularityLocked) {
          const startISO = toISO(start);
          const endISO = toISO(end);
          const autoGranularity = getWindowGranularityFromRange(
            startISO,
            endISO
          );
          setGranularityState(autoGranularity);
        }
        // Si está locked, mantener granularidad actual del usuario
      },
      [isGranularityLocked]
    );

    /**
     * clearRange: Limpiar rango custom y volver a preset
     *
     * POLÍTICA:
     * - Volver a preset según granularidad actual
     * - DESBLOQUEAR lock (permitir recálculo automático)
     * - Cambia a modo "granularity"
     */
    const clearRange = useCallback(() => {
      const preset = presetForGranularity(granularity);
      setStartDate(preset.start);
      setEndDate(preset.end);
      setMode("granularity");
      setIsGranularityLocked(false); // UNLOCK: Volver a permitir recálculo automático
    }, [granularity]);

    // Nuevos métodos para cálculos de rangos
    const getCurrentPeriod = useCallback(
      () => ({
        start: toISO(startDate),
        end: toISO(endDate),
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
        // Fallback: día anterior (UTC)
        const fallbackDate = addDaysUTC(startDate, -1);
        const fallbackStr = toISO(fallbackDate);
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
        isGranularityLocked,
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
        isGranularityLocked,
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
