// src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/UrlDetailsPanel/index.tsx
"use client";

import { UrlDetailsPanelSkeleton } from "@/features/analytics/skeletons";
import { EngagementSection } from "./EngagementSection";
import { KPIsSection } from "./KPIsSection";
import { PanelHeader } from "./PanelHeader";
import { TechnologySection } from "./TechnologySection";
import type { UrlDetailsPanelProps } from "./types";
import { useEngagementSeries } from "./useEngagementSeries";
import { useUrlKPIs } from "./useUrlKPIs";

export default function UrlDetailsPanel({
  path,
  loading,
  seriesAvgEngagement,
  kpis,
  operatingSystems,
  devices,
  countries,
  deltaPct,
  granularity,
  onClose,
  activityName,
  contextName,
}: UrlDetailsPanelProps) {
  const items = useUrlKPIs(kpis);
  const { categories, currData, prevData } = useEngagementSeries(
    seriesAvgEngagement,
    granularity
  );

  if (loading) {
    return <UrlDetailsPanelSkeleton chartHeight={260} />;
  }

  return (
    <div
      className="
        w-full p-6 rounded-lg shadow-sm border transition-all duration-200
        border-red-200/60 dark:border-red-700/40
        bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
        dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-800/90
        ring-1 ring-black/5 dark:ring-white/10
      "
    >
      <PanelHeader
        path={path}
        activityName={activityName}
        contextName={contextName}
        onClose={onClose}
      />

      <KPIsSection items={items} />

      <EngagementSection
        granularity={granularity}
        categories={categories}
        currData={currData}
        prevData={prevData}
        seriesAvgEngagement={seriesAvgEngagement}
      />

      <TechnologySection
        operatingSystems={operatingSystems}
        devices={devices}
        countries={countries}
        deltaPct={deltaPct}
      />
    </div>
  );
}
