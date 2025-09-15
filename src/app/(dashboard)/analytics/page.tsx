"use client";

import Header from "@/components/common/Header";
import TagsDrawer from "@/components/common/TagsDrawer";
import SectorsByTagSectionDetailed from "@/features/home/sectors/SectorsByTagSectionDetailed";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSearchParams } from "next/navigation";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();

  // Filtros desde la URL (opcionales)
  const pueblo = searchParams.get("pueblo") || undefined;
  const dateFrom = searchParams.get("from") || undefined; // ej: 2025-05-01
  const dateTo = searchParams.get("to") || undefined; // ej: 2025-08-31

  const scope = pueblo
    ? { kind: "pueblo" as const, pueblo }
    : { kind: "global" as const };

  const {
    allRows, // usamos todos los tags para el carrusel infinito
    tagMeta,
    defaultTagMeta,
  } = useAnalytics({
    scope,
    dateFrom,
    dateTo,
    pageSize: 999, // la paginación no aplica al slider; queremos todo
  });

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Condado de Huelva"
        subtitle="Información y estadísticas del tráfico de la web del Condado de Huelva"
      />

      {/* Top Tags - Slider infinito */}
      <section aria-labelledby="top-tags-title" className="space-y-3">
        <div className="flex items-end justify-between">
          <h2
            id="top-tags-title"
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            Top etiquetas {pueblo ? `en ${pueblo}` : "(global)"}
          </h2>
          {(dateFrom || dateTo) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Rango: {dateFrom ?? "inicio"} — {dateTo ?? "fin"}
            </p>
          )}
        </div>
        <SectorsByTagSectionDetailed />
      </section>
    </div>
  );
}
