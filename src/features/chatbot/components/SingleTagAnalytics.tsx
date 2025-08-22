"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import LineChartSkeleton from "@/components/skeletons/LineChartSkeleton";
import PieChart from "@/components/charts/PieChart";
import PieChartSkeleton from "@/components/skeletons/PieChartSkeleton";
import SubtagChecklist from "./SubtagChecklist";
import { tags, type TagCountItem } from "@/lib/analytics/adapter";
import { fmt, lastNDays } from "@/lib/analytics/utils";

type Props = {
  projectId?: string;
  /** tagPath de primer nivel, ej: "playa" */
  tagPath: string;
  /** rango inicial (por defecto últimos 30 días) */
  start?: string;
  end?: string;
  /** refresco “realtime” para la donut (ms). 0 = sin refresco */
  donutRefreshMs?: number;
  /** seleccionar por defecto los primeros N subtags (para la línea) */
  defaultSelectN?: number;
};

const CARD_BG_DARK = "dark:bg-[#14181e]";

export default function SingleTagAnalytics({
  projectId = "project_huelva",
  tagPath,
  start,
  end,
  donutRefreshMs = 5000,
  defaultSelectN = 5,
}: Props) {
  const defaultRange = useMemo(() => {
    const { start: s, end: e } = lastNDays(30);
    return { start: fmt(s), end: fmt(e) };
  }, []);
  const range = { start: start ?? defaultRange.start, end: end ?? defaultRange.end };

  const [subs, setSubs] = useState<TagCountItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Donut data (actualizable)
  const [donutData, setDonutData] = useState<{ label: string; value: number }[]>(
    []
  );
  const [donutLoading, setDonutLoading] = useState(true);

  // Selección para línea
  const [selected, setSelected] = useState<string[]>([]);

  // Carga inicial de subtags (y selección)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingSubs(true);
        const list = await tags({
          projectId,
          tagPath,
          start: range.start,
          end: range.end,
        });
        if (cancelled) return;
        setSubs(list);
        setSelected(list.slice(0, defaultSelectN).map((i) => i.tagPath));
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, tagPath, range.start, range.end, defaultSelectN]);

  // Donut: refresco periódico (realtime-like)
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const fetchDonut = async () => {
      try {
        if (!cancelled) setDonutLoading(true);
        const list = await tags({
          projectId,
          tagPath,
          start: range.start,
          end: range.end,
        });
        if (cancelled) return;
        setDonutData(list.map((s) => ({ label: s.label, value: s.count })));
      } finally {
        if (!cancelled) window.setTimeout(() => setDonutLoading(false), 120);
      }
    };

    fetchDonut();

    if (donutRefreshMs > 0) {
      timer = window.setInterval(fetchDonut, donutRefreshMs);
    }
    return () => {
      if (typeof timer === "number") window.clearInterval(timer);
      cancelled = true;
    };
  }, [projectId, tagPath, range.start, range.end, donutRefreshMs]);

  const toggleSub = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? subs.map((i) => i.tagPath) : []);

  // Datos para la línea (categorías = subtags seleccionados, serie única)
  const lineCategories = useMemo(
    () =>
      subs
        .filter((s) => selected.includes(s.tagPath))
        .map((s) => s.label),
    [subs, selected]
  );

  const lineSeries: LineSeries[] = useMemo(() => {
    const data = subs
      .filter((s) => selected.includes(s.tagPath))
      .map((s) => s.count);
    return [{ name: "Consultas", data }];
  }, [subs, selected]);

  return (
    <div
      className={`
        rounded-2xl shadow-sm
        border border-gray-200 dark:border-white/10
        bg-white ${CARD_BG_DARK}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {tagPath}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Subtags, línea por selección y donut en “tiempo real”.
          </p>
        </div>
        <div
          className="
            hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
            border border-gray-200 dark:border-white/10
            text-gray-700 dark:text-gray-300
            bg-white/70 dark:bg-[#14181e]
          "
          title="Rango de fechas"
        >
          <CalendarDaysIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>
            {range.start} — {range.end}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
        {/* Checklist */}
        <div
          className="
            rounded-xl px-4 py-4
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#14181e]
          "
        >
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Subtags de {tagPath}
          </h3>

          {loadingSubs ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="h-6 rounded bg-gray-200/70 dark:bg-white/10" />
              ))}
            </div>
          ) : (
            <SubtagChecklist
              items={subs}
              selected={selected}
              onToggle={toggleSub}
              onToggleAll={toggleAll}
            />
          )}
        </div>

        {/* Línea */}
        <div
          className="
            lg:col-span-2 rounded-xl p-3
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#14181e]
          "
        >
          {loadingSubs ? (
            <LineChartSkeleton height={280} />
          ) : lineCategories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 p-6 text-sm text-gray-500 dark:text-gray-400">
              Selecciona subtags para visualizar.
            </div>
          ) : (
            <LineChart
              categories={lineCategories}
              series={lineSeries}
              height={280}
              smooth
              type="line"
              optionsExtra={{
                markers: { size: 3 }, // puntos para que se lea mejor sobre categorías discretas
              }}
            />
          )}

          {/* Donut “realtime” */}
          <div className="mt-6">
            {donutLoading ? (
              <PieChartSkeleton height={260} />
            ) : donutData.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 p-6 text-sm text-gray-500 dark:text-gray-400">
                Sin datos para la donut.
              </div>
            ) : (
              <PieChart
                type="donut"
                data={donutData}
                height={260}
                dataLabels="percent"
                donutTotalLabel="Total"
                legendPosition="bottom"
                showLegend
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
