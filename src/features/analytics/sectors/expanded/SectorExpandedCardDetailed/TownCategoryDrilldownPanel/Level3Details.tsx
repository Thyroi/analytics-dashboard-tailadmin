import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useMemo } from "react";
import UrlDetailsPanel from "../UrlDetailsPanel";

type KpisData = {
  current: {
    activeUsers: number;
    userEngagementDuration: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
  previous: {
    activeUsers: number;
    userEngagementDuration: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
  deltaPct: {
    activeUsers: number;
    newUsers: number;
    eventCount: number;
    sessions: number;
    averageSessionDuration: number;
    avgEngagementPerUser: number;
    eventsPerSession: number;
  };
} | null;

type Level3DetailsProps = {
  selectedPath: string | null;
  townId: string;
  categoryId: string;
  detailsRef: React.RefObject<HTMLDivElement | null>;
  granularity: Granularity;
  startISO?: string;
  endISO?: string;
  urlData: {
    loading: boolean;
    seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
    kpis: KpisData;
    operatingSystems: DonutDatum[];
    devices: DonutDatum[];
    countries: DonutDatum[];
    deltaPct: number;
  };
};

export function Level3Details({
  selectedPath,
  townId,
  categoryId,
  detailsRef,
  granularity,
  startISO,
  endISO,
  urlData,
}: Level3DetailsProps) {
  const level3Key = useMemo(
    () => `${townId}-${categoryId}-${selectedPath || "none"}`,
    [townId, categoryId, selectedPath]
  );

  if (!selectedPath) return null;

  return (
    <div ref={detailsRef} className="scroll-mt-24">
      <UrlDetailsPanel
        key={level3Key}
        path={selectedPath}
        granularity={granularity}
        startISO={startISO}
        endISO={endISO}
        kpis={urlData.kpis}
        seriesAvgEngagement={urlData.seriesAvgEngagement}
        operatingSystems={urlData.operatingSystems}
        devices={urlData.devices}
        countries={urlData.countries}
        deltaPct={urlData.deltaPct}
        loading={urlData.loading}
      />
    </div>
  );
}
