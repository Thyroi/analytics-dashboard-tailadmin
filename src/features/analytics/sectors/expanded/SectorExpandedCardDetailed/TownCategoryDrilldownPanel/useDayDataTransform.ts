import { formatUrlForDisplay } from "@/lib/utils/drilldown/url-formatting";
import { useMemo } from "react";
import type { DayData } from "./types";

type DrilldownData = {
  loading: boolean;
  donut: Array<{ label: string; value: number }>;
  deltaPct: number;
  response: {
    series: {
      current: Array<{ label: string; value: number }>;
      previous: Array<{ label: string; value: number }>;
    };
  };
};

export function useDayDataTransform(
  isDayGranularity: boolean,
  drilldown: DrilldownData | null
): DayData | null {
  return useMemo(() => {
    if (!isDayGranularity || !drilldown || drilldown.loading) return null;

    // Obtener las fechas de las series (current y previous)
    const currentDate = drilldown.response.series.current[0]?.label || "Actual";
    const previousDate =
      drilldown.response.series.previous[0]?.label || "Anterior";

    // Obtener los valores actuales por URL del donut
    const currentValues = drilldown.donut.map((item) => item.value);

    // Calcular valores previous basados en deltaPct para cada URL
    const previousValues = drilldown.donut.map((item) => {
      const current = item.value;
      const delta = drilldown.deltaPct;
      if (delta === 0) return current;
      // previous = current / (1 + delta/100)
      const previous = current / (1 + delta / 100);
      return Math.round(previous);
    });

    // Cada sub-categoría es una serie con 2 valores: [previous, current]
    const groupedSeries = drilldown.donut.map((item, index) => ({
      name: formatUrlForDisplay(item.label),
      data: [previousValues[index], currentValues[index]],
    }));

    // Formatear también el donut para que las URLs se vean bien
    const formattedDonut = drilldown.donut.map((item) => ({
      id: item.label, // URL original como id (para click handlers)
      label: formatUrlForDisplay(item.label),
      value: item.value,
    }));

    // Crear seriesByUrl para que useDonutSelection funcione
    const seriesByUrl = drilldown.donut.map((item) => ({
      name: formatUrlForDisplay(item.label),
      path: item.label, // URL original
      data: [0], // Dummy data para compatibilidad
    }));

    return {
      categories: [previousDate, currentDate],
      groupedSeries,
      donut: formattedDonut,
      deltaPct: drilldown.deltaPct,
      seriesByUrl,
    };
  }, [isDayGranularity, drilldown]);
}
