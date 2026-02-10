"use client";

import { useDrilldownDetails } from "@/features/analytics/hooks/useDrilldownDetails";
import { useDrilldownTransformation } from "@/features/analytics/hooks/useDrilldownTransformation";
import { useUrlSeries } from "@/features/analytics/hooks/useUrlSeries";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { TOWN_META } from "@/lib/taxonomy/towns";
import { useMemo } from "react";
import DrilldownTitle from "../DrilldownTitle";
import { Level2Chart } from "./Level2Chart";
import { Level3Details } from "./Level3Details";
import type { TownCategoryDrilldownPanelProps } from "./types";
import { useDayDataTransform } from "./useDayDataTransform";
import { useLevel3State } from "./useLevel3State";

export default function TownCategoryDrilldownPanel({
  townId,
  categoryId,
  granularity,
  headline,
  headlinePercent,
  color = "dark",
  startISO,
  endISO,
}: TownCategoryDrilldownPanelProps) {
  // Nivel 2: sub-actividades (series por URL + donut)
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    startISO,
    endISO,
  });

  const isDayGranularity = granularity === "d";

  // TOP-3 URLs para gráfica (no para donut - donut muestra todas)
  // Solo necesario si NO es granularidad día
  const top3Urls = useMemo(() => {
    if (drilldown.loading || isDayGranularity) return [];
    const urls = drilldown.donut.slice(0, 3).map((item) => item.label);
    return urls;
  }, [drilldown, isDayGranularity]);

  // Solo fetch TOP-3 para la gráfica (skip si es granularidad día)
  const urlSeries = useUrlSeries({
    urls: top3Urls,
    granularity,
    startISO,
    endISO,
  });

  // Transform data using custom hook - SOLO para granularidades no-día
  const dd = useDrilldownTransformation(drilldown, urlSeries);

  // Para granularidad día, preparar datos directamente del drilldown
  const dayData = useDayDataTransform(
    isDayGranularity,
    drilldown.loading
      ? null
      : {
          loading: false,
          donut: drilldown.donut,
          deltaPct: drilldown.deltaPct,
          response: drilldown.response,
          seriesByUrl: drilldown.response.seriesByUrl,
        },
  );

  // Level 3 state management
  const level3 = useLevel3State(
    isDayGranularity,
    dayData,
    dd.seriesByUrl,
    dd.loading,
    granularity,
    startISO,
    endISO,
  );

  const name = useMemo(() => {
    return headline === "town"
      ? (TOWN_META[townId]?.label ?? "Pueblo")
      : (CATEGORY_META[categoryId]?.label ?? "Categoría");
  }, [headline, townId, categoryId]);

  return (
    <div className="overflow-hidden mt-8">
      <div
        className="
          rounded-xl p-6 space-y-4 shadow-sm border-l-4 transition-all duration-200
          bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
          dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-800/90
          border-gray-200/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10
        "
        style={{ borderLeftColor: "var(--color-huelva-primary, #E55338)" }}
      >
        <DrilldownTitle
          name={name}
          headlinePercent={headlinePercent}
          color={color}
        />

        {/* Nivel 2: Sub-actividades */}
        <Level2Chart
          isDayGranularity={isDayGranularity}
          dayData={dayData}
          drilldownLoading={drilldown.loading}
          ddLoading={dd.loading}
          ddXLabels={dd.xLabels}
          ddSeriesByUrl={dd.seriesByUrl}
          ddDonut={dd.donut}
          ddDeltaPct={dd.deltaPct}
          ddColorsByName={dd.colorsByName}
          granularity={granularity}
          onDonutSliceClick={level3.handleDonutSliceClick}
        />

        {/* Nivel 3: Detalles de URL seleccionada */}
        <Level3Details
          selectedPath={level3.selectedPath}
          townId={townId}
          categoryId={categoryId}
          detailsRef={level3.detailsRef}
          granularity={granularity}
          startISO={startISO}
          endISO={endISO}
          urlData={level3.url}
        />
      </div>
    </div>
  );
}
