/**
 * Vista de nivel 2 para "Otros" en contexto de pueblo (claves que no mapearon a categoría)
 *
 * Muestra desglose por leaf (último token) de todas las claves no mapeadas
 * Ejemplo: root.albacete.tejada.ermita → leaf = "ermita"
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { TOWN_META } from "@/lib/taxonomy/towns";
import TownOthersEmptyState from "./TownOthersEmptyState";
import TownOthersHeader from "./TownOthersHeader";
import type { TownOthersBreakdownViewProps } from "./TownOthersBreakdownView.types";
import { useTownOthersData } from "./useTownOthersData";

export default function TownOthersBreakdownView({
  townId,
  othersBreakdown,
  granularity,
  onBack,
}: TownOthersBreakdownViewProps) {
  const townLabel = TOWN_META[townId]?.label || townId;

  // Transformar datos a formato ChartPair
  const { donutData, totalInteractions, categories, groupedSeries } =
    useTownOthersData({
      othersBreakdown,
      granularity,
    });

  if (othersBreakdown.length === 0) {
    return <TownOthersEmptyState townLabel={townLabel} onBack={onBack} />;
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <TownOthersHeader
        townLabel={townLabel}
        totalInteractions={totalInteractions}
        onBack={onBack}
      />

      <ChartPair
        mode="grouped"
        categories={categories}
        groupedSeries={groupedSeries}
        chartTitle="Serie temporal"
        chartSubtitle={`${totalInteractions.toLocaleString()} interacciones totales`}
        donutData={donutData}
        deltaPct={null}
        donutCenterLabel="Interacciones"
        showActivityButton={false}
        granularity={granularity}
        tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
        yAxisFormatter={(val) => (val ?? 0).toString()}
        legendPosition="bottom"
        className=""
      />
    </div>
  );
}
