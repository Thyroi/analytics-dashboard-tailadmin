/**
 * Contexto para manejar fechas con nueva lógica de rangos
 */

"use client";

import type { Granularity } from "@/lib/types";
import { calculatePreviousPeriodAndGranularity } from "@/lib/utils/time/rangeCalculations";
import { createContext, useContext, useState, type ReactNode } from "react";

export type DateMode = "granularity" | "range";

export type DateContextValue = {
  mode: DateMode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;

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

  // Fechas iniciales: día por defecto
  const initialRange = calculateRangeForPeriod("dia");
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);

  const setRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setMode("range"); // Cambiar a modo range automáticamente
  };

  const clearRange = () => {
    const range = calculateRangeForPeriod("dia");
    setStartDate(range.start);
    setEndDate(range.end);
    setMode("granularity");
    setGranularity("d");
  };

  // Cambio de granularidad: ajusta fechas según períodos predefinidos
  const handleSetGranularity = (g: Granularity) => {
    setGranularity(g);
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
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
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
      // Fallback: día anterior
      const fallbackDate = new Date(startDate);
      fallbackDate.setDate(fallbackDate.getDate() - 1);
      const fallbackStr = fallbackDate.toISOString().split("T")[0];
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
