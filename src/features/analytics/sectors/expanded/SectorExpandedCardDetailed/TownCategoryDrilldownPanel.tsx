"use client";

import React, { useEffect, useMemo, useState } from "react";
import ChartPair from "./ChartPair";
import UrlDetailsPanel from "./UrlDetailsPanel";

import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import { pickPathForSubActivity } from "@/lib/utils/drilldown";

import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import DrilldownTitle from "./DrilldownTitle";

type Props = {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  headline: "town" | "category";
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
};

export default function TownCategoryDrilldownPanel({
  townId,
  categoryId,
  granularity,
  headline,
  headlinePercent,
  color = "dark",
}: Props) {
  // Nivel 2: sub-actividades (series por URL + donut)
  const dd = useTownCategoryDrilldown({ townId, categoryId, granularity });

  // Nivel 3: URL seleccionada
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const url = useUrlDrilldown({ path: selectedPath, granularity });

  // Reset del nivel 3 cuando cambie el contexto del drill
  useEffect(() => {
    setSelectedPath(null);
  }, [townId, categoryId, granularity]);

  // Nombre a mostrar en el encabezado según el primer nivel seleccionado
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
          <UrlDetailsPanel
            path={url.selectedPath ?? selectedPath}
            loading={url.loading}
            seriesAvgEngagement={url.seriesAvgEngagement}
            kpis={url.kpis}
            operatingSystems={url.operatingSystems}
            genders={url.genders}
            countries={url.countries}
            deltaPct={url.deltaPct}
            granularity={granularity}
            onClose={() => setSelectedPath(null)}
          />
        )}
      </div>
    </div>
  );
}
