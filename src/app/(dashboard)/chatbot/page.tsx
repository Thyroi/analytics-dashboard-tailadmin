"use client";

import AllTagsAnalyticsGrid from "@/features/chatbot/components/AllTagsAnalyticsGrid";
import AnalyticsTagsSection from "@/features/chatbot/components/AnalyticsTagsSection";
import TagsPieGrid from "@/features/chatbot/components/TagsPieGrid";
import TimePerformanceCard from "@/features/chatbot/components/TimePerformanceCard";
import type { DailyDatum } from "@/lib/chatbot/time";
import { SERIES } from "@/lib/mockData";
import { useMemo } from "react";

function buildDailyTotals(): DailyDatum[] {
  const totals = new Map<string, number>();
  Object.entries(SERIES).forEach(([tagPath, byDate]) => {
    if (tagPath.includes(".")) return;
    Object.entries(byDate).forEach(([date, value]) => {
      totals.set(date, (totals.get(date) ?? 0) + value);
    });
  });
  return [...totals.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, value]) => ({ date, value }));
}
function buildRootSeries(): Record<string, Record<string, number>> {
  return Object.fromEntries(
    Object.entries(SERIES).filter(([k]) => !k.includes("."))
  );
}
const TAG_COLORS: Record<string, string> = {
  playa: "#465FFF",
  museos: "#22C55E",
  gastronomia: "#F59E0B",
  parques: "#10B981",
  deportes: "#A78BFA",
  compras: "#14B8A6",
  hoteles: "#EF4444",
  eventos: "#38BDF8",
  naturaleza: "#F97316",
  transporte: "#64748B",
};

export default function AnalyticsPage() {
  const dailyData = useMemo(buildDailyTotals, []);
  const rootSeries = useMemo(buildRootSeries, []);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 0: misma fila; 2/3 + 1/3 */}
      <div className="col-span-12 grid grid-cols-12 gap-6 items-stretch">
        {/* 2/3 - AnalyticsTagsSection */}
        <div className="col-span-12 lg:col-span-8 min-w-0 h-full">
          <AnalyticsTagsSection />
        </div>

        {/* 1/3 - Card derecha */}
        <div className="col-span-12 lg:col-span-4 min-w-0 h-full">
          <TimePerformanceCard
            title="Rendimiento de búsquedas"
            data={dailyData}
            initialGranularity="day"
            showCompare
            className="h-full" 
            stackedDailyTop5={{
              seriesByTag: rootSeries,
              days: 7,
              colorsByTag: TAG_COLORS,
              stackedHeight: 260,
              titleOverride: "Top-5 por día (última semana)",
              subtitleOverride: "Barras apiladas por tag raíz",
            }}
          />
        </div>
      </div>

      {/* ROW 1 */}
      <div className="col-span-12 min-w-0">
        <TagsPieGrid />
      </div>

      {/* ROW 2 */}
      <div className="col-span-12 min-w-0">
        <AllTagsAnalyticsGrid />
      </div>
    </div>
  );
}
