/**
 * Utilidades para labels de tooltips en gráficas
 * Basados en granularidad para mantener consistencia en toda la app
 */

import type { Granularity } from "@/lib/types";

/**
 * Retorna los labels para series current y previous según granularidad
 *
 * @param granularity - La granularidad actual (d/w/m/y)
 * @returns Objeto con labels para current y previous
 *
 * @example
 * getSeriesLabels('d') // { current: 'Día actual', previous: 'Día anterior' }
 * getSeriesLabels('w') // { current: 'Semana actual', previous: 'Semana anterior' }
 * getSeriesLabels('m') // { current: 'Mes actual', previous: 'Mes anterior' }
 * getSeriesLabels('y') // { current: 'Año actual', previous: 'Año anterior' }
 */
export function getSeriesLabels(granularity: Granularity): {
  current: string;
  previous: string;
} {
  switch (granularity) {
    case "d":
      return {
        current: "Día actual",
        previous: "Día anterior",
      };
    case "w":
      return {
        current: "Semana actual",
        previous: "Semana anterior",
      };
    case "m":
      return {
        current: "Mes actual",
        previous: "Mes anterior",
      };
    case "y":
      return {
        current: "Año actual",
        previous: "Año anterior",
      };
    default:
      return {
        current: "Actual",
        previous: "Anterior",
      };
  }
}

/**
 * Retorna el label singular para el período según granularidad
 *
 * @param granularity - La granularidad actual (d/w/m/y)
 * @returns Label singular del período
 *
 * @example
 * getPeriodLabel('d') // 'Día'
 * getPeriodLabel('w') // 'Semana'
 * getPeriodLabel('m') // 'Mes'
 * getPeriodLabel('y') // 'Año'
 */
export function getPeriodLabel(granularity: Granularity): string {
  switch (granularity) {
    case "d":
      return "Día";
    case "w":
      return "Semana";
    case "m":
      return "Mes";
    case "y":
      return "Año";
    default:
      return "Período";
  }
}

/**
 * Formatea un valor para tooltip con label de serie
 *
 * @param value - El valor numérico a formatear
 * @param seriesName - Nombre de la serie ('Actual' | 'Anterior')
 * @param granularity - La granularidad actual
 * @returns String formateado para tooltip
 *
 * @example
 * formatTooltipValue(170, 'Actual', 'd') // 'Día actual: 170'
 * formatTooltipValue(668, 'Anterior', 'd') // 'Día anterior: 668'
 * formatTooltipValue(1500, 'Actual', 'w') // 'Semana actual: 1,500'
 */
export function formatTooltipValue(
  value: number,
  seriesName: "Actual" | "Anterior",
  granularity: Granularity
): string {
  const labels = getSeriesLabels(granularity);
  const label = seriesName === "Actual" ? labels.current : labels.previous;

  // Formatear número con separadores de miles
  const formattedValue = value.toLocaleString("es-ES");

  return `${label}: ${formattedValue}`;
}
