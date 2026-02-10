import { useDonutSelection } from "@/features/analytics/hooks/useDonutSelection";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import { useToast } from "@/hooks/useToast";
import type { Granularity } from "@/lib/types";
import { useEffect, useMemo } from "react";
import type { DayData } from "./types";

type SeriesByUrl = Array<{ name: string; path: string; data: number[] }>;

export function useLevel3State(
  isDayGranularity: boolean,
  dayData: DayData | null,
  ddSeriesByUrl: SeriesByUrl,
  seriesLoading: boolean,
  validPaths: string[],
  granularity: Granularity,
  startISO?: string,
  endISO?: string,
) {
  const { warning } = useToast();
  // Handle donut selection
  const { selectedPath, detailsRef, handleDonutSliceClick, clearSelection } =
    useDonutSelection(
      isDayGranularity && dayData
        ? dayData.seriesByUrl
        : seriesLoading
          ? []
          : ddSeriesByUrl,
    );

  const availablePaths = useMemo(() => new Set(validPaths), [validPaths]);

  useEffect(() => {
    if (!selectedPath) return;
    if (seriesLoading) return;

    if (!availablePaths.has(selectedPath)) {
      warning(
        "La URL seleccionada no tiene datos en este rango. Cerramos el nivel 3.",
        3500,
      );
      clearSelection();
    }
  }, [selectedPath, seriesLoading, availablePaths, warning, clearSelection]);

  // Nivel 3: URL seleccionada
  const url = useUrlDrilldown({
    path: selectedPath,
    granularity,
    startISO,
    endISO,
  });

  // Safe data extraction
  const isLoaded =
    !url.loading && "seriesAvgEngagement" in url && !!url.seriesAvgEngagement;

  const seriesAvgEngagement = isLoaded
    ? url.seriesAvgEngagement
    : { current: [], previous: [] };

  const kpis = isLoaded ? url.kpis : null;

  const operatingSystems = isLoaded ? url.operatingSystems : [];
  const devices = isLoaded ? url.devices : [];
  const countries = isLoaded ? url.countries : [];
  const deltaPct = isLoaded ? url.deltaPct : 0;

  return {
    selectedPath,
    detailsRef,
    handleDonutSliceClick,
    url: {
      loading: url.loading,
      seriesAvgEngagement,
      kpis,
      operatingSystems,
      devices,
      countries,
      deltaPct,
    },
  };
}
