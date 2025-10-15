"use client";

import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
import { useMemo } from "react";
import DrilldownTitle from "./DrilldownTitle";
import UrlDetailsPanel from "./UrlDetailsPanel";

import { useDonutSelection } from "@/features/analytics/hooks/useDonutSelection";
import { useDrilldownDetails } from "@/features/analytics/hooks/useDrilldownDetails";
import { useDrilldownTransformation } from "@/features/analytics/hooks/useDrilldownTransformation";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import { useUrlSeries } from "@/features/analytics/hooks/useUrlSeries";

import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

type Props = {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  headline: "town" | "category";
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
  /** Fin del rango si el contexto está en modo "range" */
  endISO?: string;
};

export default function TownCategoryDrilldownPanel({
  townId,
  categoryId,
  granularity,
  headline,
  headlinePercent,
  color = "dark",
  endISO,
}: Props) {
  // Nivel 2: sub-actividades (series por URL + donut)
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    endISO,
  });

  // Estabilizar las URLs para evitar re-renders infinitos
  const urlsToFetch = useMemo(() => {
    if (drilldown.loading) return [];
    return drilldown.donut.map((item) => item.label);
  }, [drilldown]);

  const urlSeries = useUrlSeries({
    urls: urlsToFetch,
    granularity,
    endISO,
  });

  // Transform data using custom hook
  const dd = useDrilldownTransformation(drilldown, urlSeries);

  // Handle donut selection with proper functionality
  const { selectedPath, detailsRef, handleDonutSliceClick } = useDonutSelection(
    dd.loading ? [] : dd.seriesByUrl
  );

  // Nivel 3: URL seleccionada
  const level3Key = useMemo(
    () => `${townId}-${categoryId}-${selectedPath || "none"}`,
    [townId, categoryId, selectedPath]
  );

  const url = useUrlDrilldown({ path: selectedPath, granularity, endISO });

  // Safe data extraction - keep it simple
  const isLoaded =
    !url.loading && "seriesAvgEngagement" in url && !!url.seriesAvgEngagement;

  const seriesAvgEngagement = isLoaded
    ? url.seriesAvgEngagement
    : { current: [], previous: [] };
  const kpis = isLoaded
    ? url.kpis
    : {
        current: {
          activeUsers: 0,
          userEngagementDuration: 0,
          newUsers: 0,
          eventCount: 0,
          sessions: 0,
          averageSessionDuration: 0,
          avgEngagementPerUser: 0,
          eventsPerSession: 0,
        },
        previous: {
          activeUsers: 0,
          userEngagementDuration: 0,
          newUsers: 0,
          eventCount: 0,
          sessions: 0,
          averageSessionDuration: 0,
          avgEngagementPerUser: 0,
          eventsPerSession: 0,
        },
        deltaPct: {
          activeUsers: 0,
          newUsers: 0,
          eventCount: 0,
          sessions: 0,
          averageSessionDuration: 0,
          avgEngagementPerUser: 0,
          eventsPerSession: 0,
        },
      };
  const operatingSystems = isLoaded ? url.operatingSystems : [];
  const devices = isLoaded ? url.devices : [];
  const countries = isLoaded ? url.countries : [];
  const deltaPct = isLoaded ? url.deltaPct : 0;

  const name = useMemo(() => {
    return headline === "town"
      ? TOWN_META[townId]?.label ?? "Pueblo"
      : CATEGORY_META[categoryId]?.label ?? "Categoría";
  }, [headline, townId, categoryId]);

  return (
    <div className="overflow-hidden mt-8">
      <div
        className="
          rounded-xl p-6 space-y-4 shadow-sm border-l-4
          bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
        "
        style={{ borderLeftColor: "var(--color-huelva-primary, #E55338)" }}
      >
        <DrilldownTitle
          name={name}
          headlinePercent={headlinePercent}
          color={color}
        />

        {/* Nivel 2: Sub-actividades */}
        {dd.loading ? (
          <ChartPairSkeleton />
        ) : (
          <ChartPair
            mode="multi"
            xLabels={dd.xLabels}
            seriesBySub={dd.seriesByUrl}
            loading={dd.loading}
            donutData={dd.donut}
            deltaPct={dd.deltaPct}
            onDonutSlice={handleDonutSliceClick}
            donutCenterLabel="Actividades"
            actionButtonTarget="actividad"
            colorsByName={dd.colorsByName}
          />
        )}

        {/* Nivel 3: Detalles de URL seleccionada */}
        {selectedPath && (
          <div ref={detailsRef} className="scroll-mt-24">
            <UrlDetailsPanel
              key={level3Key}
              path={selectedPath}
              granularity={granularity}
              endISO={endISO}
              kpis={kpis}
              seriesAvgEngagement={seriesAvgEngagement}
              operatingSystems={operatingSystems}
              devices={devices}
              countries={countries}
              deltaPct={deltaPct}
              loading={url.loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
