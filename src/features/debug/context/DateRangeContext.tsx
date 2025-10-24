/**
 * Contexto para manejar fechas con nueva lógica de rangos
 * 
 * ⚠️ MIGRADO A UTC - Reemplaza new Date() y .setDate() por addDaysUTC()
 * ⚠️ PR-2: Agregado lock de granularidad y recálculo automático por duración
 */

"use client";

import type { Granularity } from "@/lib/types";
import { addDaysUTC, todayUTC, toISO } from "@/lib/utils/time/datetime";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { getWindowGranularityFromRange } from "@/lib/utils/time/windowGranularity";
import { createContext, useContext, useState, type ReactNode } from "react";

export type DateMode = "granularity" | "range";

export type DateContextValue = {
  mode: DateMode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  isGranularityLocked: boolean;

  // Acciones
  setMode: (mode: DateMode) => void;
  setGranularity: (g: Granularity) => void;
  setRange: (start: Date, end: Date) => void;
  clearRange: () => void;

  // Datos calculados
  getCurrentPeriod: () => { start: string; end: string };
  getPreviousPeriod: () => { start: string; end: string };
  getCalculatedGranularity: () => Granularity;
  getDurationDays: () => number;
};

/**
 * Calcula el rango de fechas según el período seleccionado (UTC)
 */
function calculateRangeForPeriod(period: "dia" | "semana" | "mes" | "ano"): {
  start: Date;
  end: Date;
} {
  const yesterday = addDaysUTC(todayUTC(), -1);

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

const DateRangeContext = createContext<DateContextValue | null>(null);

type Props = {
  children: ReactNode;
  initialMode?: DateMode;
  initialGranularity?: Granularity;
};

export function DateRangeProvider({
  children,
  initialMode = "granularity",
  initialGranularity = "d",
}: Props) {
  const [mode, setMode] = useState<DateMode>(initialMode);
  const [granularity, setGranularity] =
    useState<Granularity>(initialGranularity);
  const [isGranularityLocked, setIsGranularityLocked] = useState(false);

  // Fechas iniciales: día por defecto
  const initialRange = calculateRangeForPeriod("dia");
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);

  /**
   * setRange: Usuario selecciona rango custom
   * - NO clampar aquí (DatePicker ya lo hizo)
   * - Si lock=false → recalcular granularidad automáticamente
   */
  const setRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setMode("range");

    // Si granularidad NO está locked, recalcular automáticamente
    if (!isGranularityLocked) {
      const startISO = toISO(start);
      const endISO = toISO(end);
      const autoGranularity = getWindowGranularityFromRange(startISO, endISO);
      setGranularity(autoGranularity);
    }
  };

  /**
   * clearRange: Volver a preset y UNLOCK granularidad
   */
  const clearRange = () => {
    const range = calculateRangeForPeriod("dia");
    setStartDate(range.start);
    setEndDate(range.end);
    setMode("granularity");
    setGranularity("d");
    setIsGranularityLocked(false); // UNLOCK
  };

  /**
   * handleSetGranularity: Usuario fuerza granularidad → LOCK
   */
  const handleSetGranularity = (g: Granularity) => {
    setGranularity(g);
    setIsGranularityLocked(true); // LOCK cuando usuario fuerza granularidad
    
    if (mode === "granularity") {
      // Mapear granularidad a período y ajustar fechas
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

      const range = calculateRangeForPeriod(period);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const getCurrentPeriod = () => ({
    start: toISO(startDate),
    end: toISO(endDate),
  });

  const getPreviousPeriod = () => {
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
  };

  const getCalculatedGranularity = (): Granularity => {
    if (mode === "granularity") {
      // Para modo granularidad, corregir la granularidad según el período
      const durationDays = getDurationDays();

      // Si es año (365 días), usar granularidad mes
      if (durationDays >= 365) {
        return "m";
      }

      // Para el resto (día, semana, mes), usar granularidad día
      return "d";
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
  };

  const getDurationDays = (): number => {
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
  };

  const value: DateContextValue = {
    mode,
    granularity,
    startDate,
    endDate,
    isGranularityLocked,
    setMode,
    setGranularity: handleSetGranularity, // Usar la nueva función
    setRange,
    clearRange,
    getCurrentPeriod,
    getPreviousPeriod,
    getCalculatedGranularity,
    getDurationDays,
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return context;
}
