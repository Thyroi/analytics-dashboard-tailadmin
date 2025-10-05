"use client";

import { useState } from "react";
import type { Granularity } from "@/lib/types";
import SectorsGrid from "@/features/home/sectors/SectorsGrid";
import { useCategoriesTotals } from "@/features/home/hooks/useCategoriesTotals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useCategoryDetails } from "@/features/home/hooks/useCategoryDetails";

const GRANULARITIES: Granularity[] = ["d", "w", "m", "y"];

export default function SectorsByTagSection() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { state, ids, itemsById } = useCategoriesTotals(granularity);

  // detalles (cuando hay expandido)
  const catId = expandedId as CategoryId | null;
  const { series, donutData } = useCategoryDetails(
    catId ?? ("naturaleza" as CategoryId),
    granularity
  );

  // ⬇️ PRESERVA null – no lo conviertas a 0
  const getDeltaPctFor = (id: string) =>
    state.status === "ready"
      ? (itemsById[id as CategoryId]?.deltaPct ?? null)
      : null;

  const getSeriesFor = (_id: string) =>
    catId && _id === catId ? series : { current: [], previous: [] };

  const getDonutFor = (_id: string) => (catId && _id === catId ? donutData : []);

  return (
    <section className="max-w-[1560px]">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-black/5">
          <span className="text-sm">🔎</span>
        </span>
        Interacciones por sectores
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
              {g === "d" ? "Día" : g === "w" ? "Semana" : g === "m" ? "Mes" : "Año"}
            </button>
          ))}
        </span>
      </h3>

      <SectorsGrid
        mode="tag"
        ids={ids as string[]}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={getDeltaPctFor} 
        getSeriesFor={getSeriesFor}
        getDonutFor={getDonutFor}
        expandedId={expandedId}
        onOpen={setExpandedId}
        onClose={() => setExpandedId(null)}
      />
    </section>
  );
}
