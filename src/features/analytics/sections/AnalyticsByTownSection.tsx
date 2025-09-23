"use client";

import { useState } from "react";
import type { Granularity } from "@/lib/types";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useTownDetails } from "@/features/home/hooks/useTownDetails"; // 1er nivel
import { useTownsTotals } from "@/features/home/hooks/useTownsTotals"; // reusamos
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_ID_ORDER, CATEGORY_META } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown"; // 2º nivel

const GRANULARITIES: Granularity[] = ["d", "w", "m", "y"];

const LABEL_TO_CAT: Record<string, CategoryId> = Object.fromEntries(
  CATEGORY_ID_ORDER.map((id) => [CATEGORY_META[id].label, id])
) as Record<string, CategoryId>;

export default function AnalyticsByTownSection() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { state, ids, itemsById } = useTownsTotals(granularity);

  type Drill =
    | { kind: "town"; townId: TownId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);

  const townId = expandedId as TownId | null;

  const { series: seriesTown, donutData: donutTown } = useTownDetails(
    (drill?.kind === "town" ? drill.townId : townId) ?? ("almonte" as TownId),
    granularity
  );

  const townCat = drill?.kind === "town+cat" ? drill : null;
  const { series: ddSeries, donut: ddDonut } = useTownCategoryDrilldown(
    townCat
      ? { townId: townCat.townId, categoryId: townCat.categoryId, granularity }
      : null
  );

  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? Math.round(itemsById[id as TownId]?.deltaPct ?? 0)
      : 0;

  const getSeriesFor = (_id: string) => {
    if (drill?.kind === "town+cat") return ddSeries;
    if (townId && _id === townId) return seriesTown;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    if (drill?.kind === "town+cat") return ddDonut;
    if (townId && _id === townId) return donutTown;
    return [];
  };

  const handleOpen = (id: string) => {
    setExpandedId(id);
    setDrill({ kind: "town", townId: id as TownId });
  };

  const handleSliceClick = (label: string) => {
    const categoryId = LABEL_TO_CAT[label];
    if (categoryId && expandedId) {
      setDrill({ kind: "town+cat", townId: expandedId as TownId, categoryId });
    }
  };

  return (
    <section className="max-w-[1560px]">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-black/5">
          <span className="text-sm">🗺️</span>
        </span>
        Analytics · Municipios
        <span className="ml-auto inline-flex gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1116] p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                granularity === g
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {g === "d"
                ? "Día"
                : g === "w"
                ? "Semana"
                : g === "m"
                ? "Mes"
                : "Año"}
            </button>
          ))}
        </span>
      </h3>

      <SectorsGridDetailed
        mode="town"
        ids={ids as string[]}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={(id) => getDeltaPctFor(id)}
        getSeriesFor={(id) => getSeriesFor(id)}
        getDonutFor={(id) => getDonutFor(id)}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={() => {
          setExpandedId(null);
          setDrill(null);
        }}
        onSliceClick={handleSliceClick}
      />
    </section>
  );
}
