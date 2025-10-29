import type { Granularity } from "@/lib/types";
import { toISO } from "@/lib/utils/time/datetime";
import { getWindowGranularityFromRange } from "@/lib/utils/time/windowGranularity";
import { useCallback } from "react";
import { presetForGranularity } from "./dateUtils";

type UseTimeframeActionsProps = {
  granularity: Granularity;
  isGranularityLocked: boolean;
  setGranularityState: (g: Granularity) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setMode: (mode: "granularity" | "range") => void;
  setIsGranularityLocked: (locked: boolean) => void;
};

export function useTimeframeActions({
  granularity,
  isGranularityLocked,
  setGranularityState,
  setStartDate,
  setEndDate,
  setMode,
  setIsGranularityLocked,
}: UseTimeframeActionsProps) {
  /**
   * setGranularity: Usuario fuerza una granularidad específica
   *
   * POLÍTICA:
   * - Activa LOCK de granularidad (no recalcular automáticamente)
   * - Aplica preset de fechas según granularidad
   * - Cambia a modo "granularity"
   */
  const setGranularity = useCallback(
    (g: Granularity) => {
      const preset = presetForGranularity(g);
      setGranularityState(g);
      setStartDate(preset.start);
      setEndDate(preset.end);
      setMode("granularity");
      setIsGranularityLocked(true); // LOCK: Usuario forzó granularidad
    },
    [
      setGranularityState,
      setStartDate,
      setEndDate,
      setMode,
      setIsGranularityLocked,
    ]
  );

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
      // Normalizar a medianoche UTC para evitar desfases por zona horaria
      const startUTC = new Date(
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
      );
      const endUTC = new Date(
        Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
      );

      setStartDate(startUTC);
      setEndDate(endUTC);
      setMode("range");

      // Si granularidad NO está locked, recalcular automáticamente por duración
      if (!isGranularityLocked) {
        const startISO = toISO(startUTC);
        const endISO = toISO(endUTC);
        const autoGranularity = getWindowGranularityFromRange(startISO, endISO);
        setGranularityState(autoGranularity);
      }
      // Si está locked, mantener granularidad actual del usuario
    },
    [
      isGranularityLocked,
      setStartDate,
      setEndDate,
      setMode,
      setGranularityState,
    ]
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
  }, [granularity, setStartDate, setEndDate, setMode, setIsGranularityLocked]);

  /**
   * updatePickerDatesOnly: Actualiza fechas solo para display del picker
   *
   * POLÍTICA:
   * - NO cambia el mode (permanece en "granularity")
   * - NO dispara queries porque no cambia mode a "range"
   * - Usado para UX de granularidad año (ajustar a 2025 al abrir picker)
   */
  const updatePickerDatesOnly = useCallback(
    (start: Date, end: Date) => {
      // Normalizar a medianoche UTC
      const startUTC = new Date(
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
      );
      const endUTC = new Date(
        Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
      );

      setStartDate(startUTC);
      setEndDate(endUTC);
      // NO cambiar mode, permanece en "granularity"
      // NO cambiar isGranularityLocked
    },
    [setStartDate, setEndDate]
  );

  return {
    setGranularity,
    setRange,
    clearRange,
    updatePickerDatesOnly,
  };
}
