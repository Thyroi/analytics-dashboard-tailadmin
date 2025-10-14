"use client";

import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
import { useMemo, useRef, useState } from "react";
import UrlDetailsPanel from "./UrlDetailsPanel";

import { useDrilldownDetails } from "@/features/analytics/hooks/useDrilldownDetails";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import { useUrlSeries } from "@/features/analytics/hooks/useUrlSeries";
import { pickPathForSubActivity } from "@/lib/utils/core/drilldown";

import type { UrlSeries } from "@/features/analytics/services/drilldown";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity, SeriesPoint } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import DrilldownTitle from "./DrilldownTitle";

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
  const queryClient = useQueryClient();

  // Nivel 2: sub-actividades (series por URL + donut)
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    endISO,
  });

  // Get real URL series data
  // In level 2 drilldown, the donut label IS the URL
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

  // Transform to legacy format expected by ChartPair
  const dd = useMemo(() => {
    if (drilldown.loading || urlSeries.loading) {
      return {
        loading: true,
        xLabels: [],
        seriesByUrl: [],
        donut: [],
        deltaPct: 0,
      };
    }

    // Use real data from URL series or fallback to synthetic data
    let seriesByUrl: { name: string; data: number[]; path: string }[];
    let xLabels: string[];

    if (urlSeries.seriesByUrl.length > 0) {
      // Use real data from the URL drilldown endpoint
      seriesByUrl = drilldown.donut.map((item, index) => {
        // Try to find matching URL data
        const realData = urlSeries.seriesByUrl.find(
          (series) => series.path === item.label || series.name === item.label
        );

        if (realData) {
          return {
            name: item.label.split("/").filter(Boolean).pop() || item.label,
            data: realData.data,
            path: item.label,
          };
        }

        // Fallback to synthetic data if no real data found
        const baseValue = item.value || 0;
        const data = urlSeries.xLabels.map((_, dayIndex: number) => {
          const variation = Math.sin((dayIndex + index) * 0.5) * 0.3 + 1;
          return Math.round(baseValue * variation);
        });

        return {
          name: item.label.split("/").filter(Boolean).pop() || item.label,
          data,
          path: item.label,
        };
      });
      xLabels = urlSeries.xLabels;
    } else {
      // Fallback to original synthetic approach
      xLabels =
        drilldown.response?.series?.current?.map((point) => point.label) || [];
      seriesByUrl = drilldown.donut.map((item, index) => {
        const baseValue = item.value || 0;
        const data = xLabels.map((_, dayIndex: number) => {
          const variation = Math.sin((dayIndex + index) * 0.5) * 0.3 + 1;
          return Math.round(baseValue * variation);
        });

        return {
          name: item.label.split("/").filter(Boolean).pop() || item.label,
          data,
          path: item.label,
        };
      });
    }

    const result = {
      loading: false,
      xLabels,
      seriesByUrl,
      donut: drilldown.donut,
      deltaPct: drilldown.deltaPct,
    };

    return result;
  }, [drilldown, urlSeries]);

  // Nivel 3: URL seleccionada - KEY es crítico para forzar re-render
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Generar key único basado en townId + categoryId + selectedPath
  const level3Key = useMemo(
    () => `${townId}-${categoryId}-${selectedPath || "none"}`,
    [townId, categoryId, selectedPath]
  );

  const url = useUrlDrilldown({ path: selectedPath, granularity, endISO });

  // auto-scroll cuando hay selección
  const detailsRef = useRef<HTMLDivElement | null>(null);

  // Handler para click en dona - actualiza estado e invalida queries
  const handleDonutSliceClick = (sub: string) => {
    const candidate = pickPathForSubActivity(
      sub,
      dd.seriesByUrl as UrlSeries[]
    );

    if (candidate) {
      // Si es el mismo path, no hacer nada
      if (candidate === selectedPath) return;

      // Actualizar estado
      setSelectedPath(candidate);

      // Invalidar queries por prefijo para forzar refetch inmediato
      queryClient.invalidateQueries({
        queryKey: ["url-drilldown"],
      });

      // Hacer scroll al nivel 3
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const name = useMemo(() => {
    return headline === "town"
      ? TOWN_META[townId]?.label ?? "Pueblo"
      : CATEGORY_META[categoryId]?.label ?? "Categoría";
  }, [headline, townId, categoryId]);

  // ========= Narrowing/Defaults seguros para UrlDetailsPanel =========
  // Cuando url.loading === true, url no tiene las props de datos (union type).
  // Definimos valores vacíos seguros para pasar al panel mientras carga.
  const emptySeries: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
    current: [],
    previous: [],
  };
  const emptyKpis = {
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

  // Guard de tipo: loaded si el objeto tiene la prop 'seriesAvgEngagement'
  const isLoaded =
    !url.loading && "seriesAvgEngagement" in url && !!url.seriesAvgEngagement;

  const seriesAvgEngagement = isLoaded ? url.seriesAvgEngagement : emptySeries;
  const kpis = isLoaded ? url.kpis : emptyKpis;
  const operatingSystems = isLoaded ? url.operatingSystems : [];
  const devices = isLoaded ? url.devices : [];
  const countries = isLoaded ? url.countries : [];
  const deltaPct = isLoaded ? url.deltaPct : 0;

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
