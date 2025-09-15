"use client";

import { Suspense } from "react";
import Header from "@/components/common/Header";
import SectorsByTagSectionDetailed from "@/features/home/sectors/SectorsByTagSectionDetailed";
import { useSearchParams } from "next/navigation";

// Wrapper que solo agrega el Suspense boundary
export default function AnalyticsPage() {
  return (
    <Suspense fallback={null /* o un skeleton */}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function AnalyticsPageInner() {
  const searchParams = useSearchParams();

  const pueblo = searchParams.get("pueblo") || undefined;
  const dateFrom = searchParams.get("from") || undefined; // ej: 2025-05-01
  const dateTo = searchParams.get("to") || undefined;     // ej: 2025-08-31


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
