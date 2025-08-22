"use client";

import PieChart from "@/components/charts/PieChart";
import ComparativeLines from "@/features/chatbot/components/ComparativeLines";
import SubtagChecklist from "@/features/chatbot/components/SubtagChecklist";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  tags,
  trend,
  type TagCountItem,
  type TrendPoint,
} from "@/lib/analytics/adapter";
import {
  fmt,
  lastNDays,
  listDays,
  type Granularity,
} from "@/lib/analytics/utils";

type Props = {
  projectId?: string;
  /** Tag de primer nivel, ej: "playa" */
  tagPath: string;
  /** cuántos subtags seleccionar por defecto */
  defaultSelectN?: number;
};

const PROJECT_FALLBACK = "project_huelva";

export default function SingleTagAnalytics({
  projectId = PROJECT_FALLBACK,
  tagPath,
  defaultSelectN = 3,
}: Props) {
  // Rango por defecto (últimos 30 días)
  const { start, end } = lastNDays(30);
  const [range] = useState({ start: fmt(start), end: fmt(end) });

  // Estado de granularidad (igual al ejemplo)
  const [granularity, setGranularity] = useState<Granularity>("day");

  // Subtags y selección actual
  const [subs, setSubs] = useState<TagCountItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  // 1) Cargar subtags del tag fijo
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await tags({
        projectId,
        tagPath,
        start: range.start,
        end: range.end,
      });
      if (cancelled) return;
      setSubs(list);
      // seleccionar N por defecto (orden de llegada)
      setSelected(list.slice(0, defaultSelectN).map((i) => i.tagPath));
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, tagPath, range.start, range.end, defaultSelectN]);

  // 2) Cargar series de tendencia por cada subtag seleccionado
  const [series, setSeries] = useState<Record<string, TrendPoint[]>>({});
  useEffect(() => {
    if (selected.length === 0) {
      setSeries({});
      return;
    }
    let cancelled = false;
    (async () => {
      const arr = await Promise.all(
        selected.map((p) =>
          trend({
            projectId,
            tagPath: p,
            start: range.start,
            end: range.end,
            granularity,
          })
        )
      );
      if (cancelled) return;
      const m: Record<string, TrendPoint[]> = {};
      selected.forEach((k, i) => {
        m[k] = arr[i];
      });
      setSeries(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, projectId, tagPath, range.start, range.end, granularity]);

  // Handlers selección
  const toggleSub = (p: string) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? subs.map((i) => i.tagPath) : []);

  // Fechas/categorías para la línea (igual al ejemplo)
  const dates = useMemo(() => {
    if (granularity !== "day") {
      const keys = new Set<string>();
      Object.values(series).forEach((arr) =>
        arr.forEach((p) => keys.add(p.date))
      );
      return [...keys].sort();
    }
    return listDays(new Date(range.start), new Date(range.end));
  }, [series, range.start, range.end, granularity]);

  // Columnas (series) con label legible
  const columns = useMemo(
    () =>
      selected.map((p) => ({
        key: p,
        label: p.split(".").pop() ?? p,
      })),
    [selected]
  );

  // Datos para el pie (distribución total por subtag en el rango)
  const pieData = useMemo(
    () => subs.map((s) => ({ label: s.label, value: s.count })),
    [subs]
  );

  return (
    <div
      className="
        rounded-2xl shadow-sm
        border border-gray-200 dark:border-white/10
        bg-white dark:bg-[#14181e]
      "
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between px-5 py-4
          border-b border-gray-100 dark:border-white/10
        "
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {tagPath}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Checklist + Pie (izquierda) y tendencia temporal por subtag
            (derecha)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="
              hidden md:flex items-center gap-2
              rounded-lg px-3 py-1.5 text-sm
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
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 pb-5 pt-4">
        {/* IZQUIERDA: Checklist + Pie en el MISMO card */}
        <div
          className="
            md:col-span-1 rounded-xl px-4 py-4
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#14181e]
          "
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Subtags de {tagPath}
            </h3>
            <select
              className="
                rounded-lg px-2 py-1 text-xs
                border border-gray-200 dark:border-white/10
                bg-transparent
                text-gray-700 dark:text-gray-300
              "
              value={granularity}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value;
                if (v === "day" || v === "week" || v === "month")
                  setGranularity(v);
              }}
              title="Granularidad"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>

          {/* Checklist */}
          <SubtagChecklist
            items={subs}
            selected={selected}
            onToggle={toggleSub}
            onToggleAll={toggleAll}
          />

          {/* Pie debajo del checklist */}
          <div className="mt-4 rounded-lg border border-gray-100 dark:border-white/10 p-2">
            {pieData.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-200 dark:border-white/10 p-4 text-xs text-gray-500 dark:text-gray-400">
                Sin datos para mostrar.
              </div>
            ) : (
              <PieChart
                type="donut" // <- pie (no donut), como pediste
                data={pieData}
                height={220}
                dataLabels="percent"
                legendPosition="bottom"
                showLegend
              />
            )}
          </div>
        </div>

        {/* DERECHA: Línea comparativa (tiempo) */}
        <div
          className="
            md:col-span-2 rounded-xl p-3
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#14181e]
          "
        >
          {columns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 p-6 text-sm text-gray-500 dark:text-gray-400">
              Selecciona subtags para comparar.
            </div>
          ) : (
            <ComparativeLines
              columns={columns}
              categories={dates}
              seriesByKey={series}
              height={360}
              smooth
              type="line"
            />
          )}
        </div>
      </div>
    </div>
  );
}
