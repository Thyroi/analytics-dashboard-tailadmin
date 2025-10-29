import type { Granularity } from "@/lib/types";
import type { ReactNode } from "react";

export type Mode = "granularity" | "range";

export type TimeframeState = {
  mode: Mode;
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  /** Lock granularity: Si true, el usuario forzó granularidad y no se debe recalcular automáticamente */
  isGranularityLocked: boolean;
};

export type TimeframeActions = {
  setGranularity: (g: Granularity) => void;
  setRange: (start: Date, end: Date) => void;
  clearRange: () => void;
  /** Actualiza fechas solo para display del picker, sin cambiar mode ni disparar queries */
  updatePickerDatesOnly: (start: Date, end: Date) => void;
};

export type TimeframeContextValue = TimeframeState & {
  /** YYYY-MM-DD si mode === "range"; si no, undefined */
  endISO?: string;
  /** YYYY-MM-DD siempre disponible para algunos contextos */
  startISO?: string;

  // Métodos para rangos calculados
  getCurrentPeriod: () => { start: string; end: string };
  getPreviousPeriod: () => { start: string; end: string };
  getCalculatedGranularity: () => Granularity;
  getDurationDays: () => number;
} & TimeframeActions;

export type TimeframeProviderProps = {
  children: ReactNode;
  defaultGranularity?: Granularity;
};
