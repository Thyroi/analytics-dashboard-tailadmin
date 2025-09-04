"use client";

import { MapPinIcon } from "@heroicons/react/24/solid";
import { useTownTotals, useTotals } from "@/hooks/useTags";
import type { Granularity } from "@/lib/chatbot/tags";

type Props = {
  title?: string;
  className?: string;
  maxHeight?: number; // px
  startTime?: string;
  endTime?: string;
  granularity: Granularity;
  showVisitsInstead?: boolean; // si true, muestra visitas como monto principal
};

function fmtNumber(n: number) {
  return new Intl.NumberFormat("es-ES").format(n);
}
function fmtPercent(p: number) {
  return `${p.toFixed(2)}%`;
}

export default function TownTotalsList({
  title = "Totales por municipio",
  className = "",
  maxHeight = 420,
  startTime,
  endTime,
  granularity,
  showVisitsInstead = false,
}: Props) {
  const rows = useTownTotals(granularity, { startTime, endTime });
  const { interactions: totalInteractions } = useTotals({ startTime, endTime });

  return (
    <section
      className={`rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-black/5 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
          <span className="sr-only">Opciones</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </div>
      </div>

      {/* List */}
      <div
        className="px-2 pb-2 overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <ul className="divide-y divide-gray-100 dark:divide-white/10">
          {rows.map((row) => {
            const share =
              totalInteractions > 0
                ? (row.interactions / totalInteractions) * 100
                : 0;

            const mainNumber = showVisitsInstead
              ? row.visits
              : row.interactions;

            return (
              <li key={row.town} className="py-3 px-2">
                <div className="flex items-center gap-3">
                  {/* Avatar / icono */}
                  <div className="h-10 w-10 rounded-full bg-huelva-primary text-white flex items-center justify-center shrink-0">
                    <MapPinIcon className="h-5 w-5" />
                  </div>

                  {/* Nombre y subtítulo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {toTitle(row.town)}
                      </p>
                      <p className="ml-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {fmtNumber(mainNumber)}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {showVisitsInstead ? "Visitas" : "Interacciones"}
                      </p>

                      {/* % de participación */}
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 px-2 py-[2px] text-[11px] font-medium">
                        {fmtPercent(share)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* Helpers */

function toTitle(slug: string) {
  // Convierte slugs como "laPalmaDelCondado" o "puertasMurallaNiebla" a títulos legibles
  // 1) si contiene guiones o underscores, separa por ellos
  // 2) si es camelCase, inserta espacios antes de mayúsculas
  if (slug.includes("-") || slug.includes("_")) {
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
  return slug
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
