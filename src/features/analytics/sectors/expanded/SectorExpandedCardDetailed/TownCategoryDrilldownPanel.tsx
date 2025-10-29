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
import { formatUrlForDisplay } from "@/lib/utils/drilldown/url-formatting"; // ✅ Reactivado con formato mejorado

type Props = {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  headline: "town" | "category";
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
  /** Inicio del rango (YYYY-MM-DD) */
  startISO?: string;
  /** Fin del rango (YYYY-MM-DD) */
  endISO?: string;
};

export default function TownCategoryDrilldownPanel({
  townId,
  categoryId,
  granularity,
  headline,
  headlinePercent,
  color = "dark",
  startISO,
  endISO,
}: Props) {
  // Nivel 2: sub-actividades (series por URL + donut)
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    startISO, // ✅ Ahora pasamos startISO
    endISO,
  });

  // ✅ Para granularidad día, usar comparación temporal en lugar de URLs
  const isDayGranularity = granularity === "d";

  // ✅ TOP-5 URLs para gráfica (no para donut - donut muestra todas)
  // Solo necesario si NO es granularidad día
  const top5Urls = useMemo(() => {
    if (drilldown.loading || isDayGranularity) return [];
    const urls = drilldown.donut.slice(0, 5).map((item) => item.label);
    return urls;
  }, [drilldown, isDayGranularity]);

  // ✅ Solo fetch TOP-5 para la gráfica (skip si es granularidad día)
  const urlSeries = useUrlSeries({
    urls: top5Urls, // ✅ Solo top-5
    granularity,
    startISO,
    endISO,
  });

  // Transform data using custom hook - SOLO para granularidades no-día
  const dd = useDrilldownTransformation(drilldown, urlSeries);

  // ✅ Para granularidad día, preparar datos directamente del drilldown
  const dayData = useMemo(() => {
    if (!isDayGranularity || drilldown.loading) return null;

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
      name: formatUrlForDisplay(item.label), // ✅ Formatear TODA la URL manteniendo unicidad
      data: [previousValues[index], currentValues[index]], // [valor en fecha anterior, valor en fecha actual]
    }));

    // ✅ Formatear también el donut para que las URLs se vean bien
    const formattedDonut = drilldown.donut.map((item) => ({
      id: item.label, // URL original como id (para click handlers)
      label: formatUrlForDisplay(item.label), // ✅ URL formateada manteniendo TODOS los niveles
      value: item.value,
    }));

    // ✅ Crear seriesByUrl para que useDonutSelection funcione
    const seriesByUrl = drilldown.donut.map((item) => ({
      name: formatUrlForDisplay(item.label), // ✅ Nombre formateado
      path: item.label, // URL original
      data: [0], // Dummy data para compatibilidad
    }));

    return {
      categories: [previousDate, currentDate], // Las 2 fechas en el eje X
      groupedSeries, // Una serie por cada sub-categoría
      donut: formattedDonut, // ✅ Donut con URLs formateadas
      deltaPct: drilldown.deltaPct,
      seriesByUrl, // ✅ Para que useDonutSelection funcione
    };
  }, [isDayGranularity, drilldown]);

  // Handle donut selection with proper functionality
  // ✅ Para granularidad día, usar seriesByUrl de dayData
  const { selectedPath, detailsRef, handleDonutSliceClick } = useDonutSelection(
    isDayGranularity && dayData
      ? dayData.seriesByUrl
      : dd.loading
      ? []
      : dd.seriesByUrl
  );

  // Nivel 3: URL seleccionada
  const level3Key = useMemo(
    () => `${townId}-${categoryId}-${selectedPath || "none"}`,
    [townId, categoryId, selectedPath]
  );

  const url = useUrlDrilldown({
    path: selectedPath,
    granularity,
    startISO, // ✅ Pasar startISO
    endISO,
  });

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
        {drilldown.loading ? (
          <ChartPairSkeleton />
        ) : isDayGranularity && dayData ? (
          // ✅ Para granularidad día: múltiples barras (una por URL) en cada fecha
          <ChartPair
            mode="grouped"
            categories={dayData.categories}
            groupedSeries={dayData.groupedSeries}
            chartTitle="Comparación por sub-categorías"
            chartSubtitle="Cada fecha muestra todas las sub-categorías"
            chartHeight={400}
            tooltipFormatter={(val) => val.toLocaleString()}
            yAxisFormatter={(val) => val.toString()}
            legendPosition="bottom"
            donutData={dayData.donut}
            deltaPct={dayData.deltaPct}
            onDonutSlice={handleDonutSliceClick}
            donutCenterLabel="Interacciones"
            actionButtonTarget="actividad"
            granularity={granularity}
          />
        ) : dd.loading ? (
          <ChartPairSkeleton />
        ) : (
          // Para otras granularidades: comparación por URLs
          <ChartPair
            mode="multi"
            xLabels={dd.xLabels}
            seriesBySub={dd.seriesByUrl}
            loading={dd.loading}
            donutData={dd.donut}
            deltaPct={dd.deltaPct}
            onDonutSlice={handleDonutSliceClick}
            donutCenterLabel="Interacciones"
            actionButtonTarget="actividad"
            colorsByName={dd.colorsByName}
            granularity={granularity}
          />
        )}

        {/* Nivel 3: Detalles de URL seleccionada */}
        {selectedPath && (
          <div ref={detailsRef} className="scroll-mt-24">
            <UrlDetailsPanel
              key={level3Key}
              path={selectedPath}
              granularity={granularity}
              startISO={startISO}
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
