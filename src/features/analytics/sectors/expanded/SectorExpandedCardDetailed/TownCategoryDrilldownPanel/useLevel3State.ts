import { useDonutSelection } from "@/features/analytics/hooks/useDonutSelection";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import type { Granularity } from "@/lib/types";
import type { DayData } from "./types";

type SeriesByUrl = Array<{ name: string; path: string; data: number[] }>;

export function useLevel3State(
  isDayGranularity: boolean,
  dayData: DayData | null,
  ddSeriesByUrl: SeriesByUrl,
  ddLoading: boolean,
  granularity: Granularity,
  startISO?: string,
  endISO?: string
) {
  // Handle donut selection
  const { selectedPath, detailsRef, handleDonutSliceClick } = useDonutSelection(
    isDayGranularity && dayData
      ? dayData.seriesByUrl
      : ddLoading
      ? []
      : ddSeriesByUrl
  );

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
