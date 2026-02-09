import { formatUrlForDisplay } from "@/lib/utils/drilldown/url-formatting";
import { useMemo } from "react";
import type { DayData } from "./types";

type DrilldownData = {
  loading: boolean;
  donut: Array<{ label: string; value: number }>;
  deltaPct: number | null;
  response: {
    series: {
      current: Array<{ label: string; value: number }>;
      previous: Array<{ label: string; value: number }>;
    };
  };
  seriesByUrl?: Array<{
    path: string;
    name: string;
    current: number | null;
    previous: number | null;
  }>;
};

export function useDayDataTransform(
  isDayGranularity: boolean,
  drilldown: DrilldownData | null,
): DayData | null {
  return useMemo(() => {
    if (!isDayGranularity || !drilldown || drilldown.loading) return null;

    // Obtener las fechas de las series (current y previous)
    const currentDate = drilldown.response.series.current[0]?.label || "Actual";
    const previousDate =
      drilldown.response.series.previous[0]?.label || "Anterior";

    const seriesSources =
      drilldown.seriesByUrl && drilldown.seriesByUrl.length > 0
        ? drilldown.seriesByUrl
        : drilldown.donut.map((item) => ({
            path: item.label,
            name: item.label,
            current: item.value,
            previous: null,
          }));

    // Cada sub-categoría es una serie con 2 valores: [previous, current]
    const groupedSeries = seriesSources.map((item) => ({
      name: formatUrlForDisplay(item.path),
      data: [item.previous ?? null, item.current ?? null],
    }));

    // Formatear también el donut para que las URLs se vean bien
    const formattedDonut = drilldown.donut.map((item) => ({
      id: item.label, // URL original como id (para click handlers)
      label: formatUrlForDisplay(item.label),
      value: item.value,
    }));

    // Crear seriesByUrl para que useDonutSelection funcione
    const seriesByUrl = seriesSources.map((item) => ({
      name: item.name,
      path: item.path,
      data: [item.current ?? 0],
    }));

    return {
      categories: [previousDate, currentDate],
      groupedSeries,
      donut: formattedDonut,
      deltaPct: drilldown.deltaPct ?? 0,
      seriesByUrl,
    };
  }, [isDayGranularity, drilldown]);
}
