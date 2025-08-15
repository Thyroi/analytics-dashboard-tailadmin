"use client";

import BarChart from "@/components/charts/BarChart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { fetchMonthlyVisits } from "@/features/analytics/services/monthlyVisits";
import type { MultiSeriesCategoriesPayload } from "@/features/analytics/types";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

const CHART_HEIGHT = 180;

export default function MonthlyVisitsSection() {
  const [data, setData] = useState<MultiSeriesCategoriesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetchMonthlyVisits();
        if (!cancelled) setData(resp);
      } catch (e) {
        console.error("MonthlyVisitsSection:", e);
        if (!cancelled) setData({ categories: [], series: [] });
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <ChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between card-header">
        <div>
          <h3 className="card-title">Visitas mensuales</h3>
          <p className="card-subtitle">Usuarios activos por mes</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen((s) => !s)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 text-left"
              >
                Ver más
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        {data && data.series.length > 0 ? (
          <BarChart
            categories={data.categories}
            series={data.series}
            height={CHART_HEIGHT}
            // opcional: paleta/colores
            palette={["#465FFF"]} // azul por defecto
            showLegend={false}
          />
        ) : (
          <div style={{ height: CHART_HEIGHT }} />
        )}
      </div>
    </div>
  );
}
