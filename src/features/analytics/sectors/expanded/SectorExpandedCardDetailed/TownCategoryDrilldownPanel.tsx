"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChartPair from "./ChartPair";
import UrlDetailsPanel from "./UrlDetailsPanel";

import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import { pickPathForSubActivity } from "@/lib/utils/drilldown";

import type { UrlSeries } from "@/features/analytics/services/drilldown";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity, SeriesPoint } from "@/lib/types";
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
  // Nivel 2: sub-actividades (series por URL + donut)
  const dd = useTownCategoryDrilldown({
    townId,
    categoryId,
    granularity,
    endISO,
  });

  // Nivel 3: URL seleccionada
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const url = useUrlDrilldown({ path: selectedPath, granularity, endISO });

  // reset selección al cambiar town/cat
  useEffect(() => {
    setSelectedPath(null);
  }, [townId, categoryId]);

  // auto-scroll cuando hay selección
  const detailsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedPath) return;
    const t = setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [selectedPath]);

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
  const genders = isLoaded ? url.genders : [];
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
        <ChartPair
          mode="multi"
          xLabels={dd.xLabels}
          seriesBySub={dd.seriesByUrl}
          loading={dd.loading}
          donutData={dd.donut}
          deltaPct={dd.deltaPct}
          onDonutSlice={(sub) => {
            const candidate = pickPathForSubActivity(
              sub,
              dd.seriesByUrl as UrlSeries[]
            );
            if (candidate) setSelectedPath(candidate);
          }}
          donutCenterLabel="Actividades"
          actionButtonTarget="actividad"
        />

        {/* Nivel 3: Detalle de la URL seleccionada */}
        {selectedPath && (
          <div ref={detailsRef} className="scroll-mt-24">
            <UrlDetailsPanel
              path={url.selectedPath ?? selectedPath}
              loading={url.loading}
              seriesAvgEngagement={seriesAvgEngagement}
              kpis={kpis}
              operatingSystems={operatingSystems}
              genders={genders}
              countries={countries}
              deltaPct={deltaPct}
              granularity={granularity}
              onClose={() => setSelectedPath(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
