"use client";

import { useState } from "react";
import type { Granularity } from "@/lib/types";
import SectorsGridDetailed from "@/features/analytics/sectors/SectorsGridDetailed";
import { useCategoriesTotals } from "@/features/home/hooks/useCategoriesTotals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_ID_ORDER, TOWN_META } from "@/lib/taxonomy/towns";
import { useCategoryDetails } from "@/features/home/hooks/useCategoryDetails";

const GRANULARITIES: Granularity[] = ["d", "w", "m", "y"];

// label -> id (pueblos)
const LABEL_TO_TOWN: Record<string, TownId> = Object.fromEntries(
  TOWN_ID_ORDER.map((id) => [TOWN_META[id].label, id])
) as Record<string, TownId>;

export default function AnalyticsByTagSection() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { state, ids, itemsById } = useCategoriesTotals(granularity);

  type Drill =
    | { kind: "category"; categoryId: CategoryId }
    | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

  const [drill, setDrill] = useState<Drill | null>(null);

  const catId = expandedId as CategoryId | null;

  // SIEMPRE cargamos el detalle de la categoría para el card superior
  const { series: seriesCat, donutData: donutCat } = useCategoryDetails(
    (drill?.kind === "category" ? drill.categoryId : catId) ?? ("naturaleza" as CategoryId),
    granularity
  );

  // Funciones para SectorsGridDetailed (no reemplazamos arriba por el drill)
  const getDeltaPctFor = (id: string) =>
    state.status === "ready" ? Math.round(itemsById[id as CategoryId]?.deltaPct ?? 0) : 0;

  const getSeriesFor = (_id: string) => {
    if (catId && _id === catId) return seriesCat;
    return { current: [], previous: [] };
  };

  const getDonutFor = (_id: string) => {
    if (catId && _id === catId) return donutCat; // donut de pueblos por categoría
    return [];
  };

  const handleOpen = (id: string) => {
    setExpandedId(id);
    setDrill({ kind: "category", categoryId: id as CategoryId });
  };

  // click en el donut superior (pueblo) → activar panel forzado con ese town+cat
  const handleSliceClick = (label: string) => {
    const townId = LABEL_TO_TOWN[label];
    if (townId && expandedId) {
      setDrill({ kind: "town+cat", townId, categoryId: expandedId as CategoryId });
    }
  };

  return (
    <section className="max-w-[1560px]">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-black/5">
          <span className="text-sm">🔎</span>
        </span>
        Analytics · Sectores (categorías)
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

      <SectorsGridDetailed
        mode="tag"
        ids={ids as string[]}
        granularity={granularity}
        onGranularityChange={setGranularity}
        getDeltaPctFor={(id) => getDeltaPctFor(id)}
        getSeriesFor={(id) => getSeriesFor(id)}
        getDonutFor={(id) => getDonutFor(id)}
        expandedId={expandedId}
        onOpen={handleOpen}
        onClose={() => { setExpandedId(null); setDrill(null); }}
        onSliceClick={handleSliceClick}
        /**
         * ⚙️ Pasamos el “forzado” solo cuando hay drill town+cat.
         * - forceDrillTownId activa el panel de abajo
         * - fixedCategoryId le dice a ese panel qué categoría usar (la del card)
         */
        forceDrillTownId={drill?.kind === "town+cat" ? drill.townId : undefined}
        fixedCategoryId={drill?.kind === "town+cat" ? drill.categoryId : undefined}
      />
    </section>
  );
}
