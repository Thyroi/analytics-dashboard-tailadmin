"use client";

import { useState } from "react";
import type { Granularity } from "@/lib/types";
import SectorsGrid from "./SectorsGrid";
import { useTownsTotals } from "../hooks/useTownsTotals";
import type { TownId } from "@/lib/taxonomy/towns";
import { useTownDetails } from "../hooks/useTownDetails";

const GRANULARITIES: Granularity[] = ["d", "w", "m", "y"];

export default function SectorsByTownSection() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { state, ids, itemsById } = useTownsTotals(granularity);

  const townId = expandedId as TownId | null;
  const { series, donutData } = useTownDetails(townId ?? ("almonte" as TownId), granularity);

  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? Math.round(itemsById[id as TownId]?.deltaPct ?? 0) : 0;

  const getSeriesFor = (_id: string) => (townId && _id === townId ? series : { current: [], previous: [] });
  const getDonutFor = (_id: string) => (townId && _id === townId ? donutData : []);

  return (
    <section className="max-w-[1560px]">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-black/5">
          <span className="text-sm">🗺️</span>
        </span>
        Interacciones por municipios
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
        mode="town"
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
