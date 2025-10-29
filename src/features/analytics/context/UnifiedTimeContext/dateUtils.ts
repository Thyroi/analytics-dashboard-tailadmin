import type { Granularity } from "@/lib/types";
import { addDaysUTC } from "@/lib/utils/time/datetime";

/**
 * Calcula la fecha de "ayer" en UTC
 *
 * ⚠️ IMPORTANTE: Usar fecha LOCAL para determinar "hoy", no UTC
 * Esto evita que a las 9 PM en España (UTC+1) el sistema piense que ya es mañana
 */
export function yesterdayUTC(): Date {
  const now = new Date();
  const todayLocal = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const yesterday = addDaysUTC(todayLocal, -1);
  return yesterday;
}

/**
 * Calcula el rango de fechas según el período seleccionado (UTC)
 *
 * ⚠️ Migrado a UTC - Reemplaza new Date() y .setDate() por addDaysUTC()
 */
export function calculateRangeForPeriod(
  period: "dia" | "semana" | "mes" | "ano"
): {
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

/**
 * Preset por granularidad, terminando AYER
 */
export function presetForGranularity(g: Granularity) {
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
