"use client";

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
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import ComparativeLines from "./ComparativeLines";
import HeatChips from "./HeatChips";
import SubtagChecklist from "./SubtagChecklist";
import WordCloudHeat from "./WordCloudHeat";

const PROJECT = "project_huelva";

export default function AnalyticsTagsSection() {
  const { start, end } = lastNDays(30);
  const [range] = useState({ start: fmt(start), end: fmt(end) });
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [subSelected, setSubSelected] = useState<string[]>([]);

  const [top, setTop] = useState<TagCountItem[]>([]);
  const [subs, setSubs] = useState<TagCountItem[]>([]);

  useEffect(() => {
    tags({ projectId: PROJECT, start: range.start, end: range.end }).then(
      setTop
    );
  }, [range.start, range.end]);

  useEffect(() => {
    if (!selectedTag) {
      setSubs([]);
      setSubSelected([]);
      return;
    }
    tags({
      projectId: PROJECT,
      tagPath: selectedTag,
      start: range.start,
      end: range.end,
    }).then((list) => {
      setSubs(list);
      setSubSelected(list.slice(0, 3).map((i) => i.tagPath));
    });
  }, [selectedTag, range.start, range.end]);

  const [series, setSeries] = useState<Record<string, TrendPoint[]>>({});
  useEffect(() => {
    if (subSelected.length === 0) {
      setSeries({});
      return;
    }
    Promise.all(
      subSelected.map((p) =>
        trend({
          projectId: PROJECT,
          tagPath: p,
          start: range.start,
          end: range.end,
          granularity,
        })
      )
    ).then((arr) => {
      const m: Record<string, TrendPoint[]> = {};
      subSelected.forEach((k, i) => {
        m[k] = arr[i];
      });
      setSeries(m);
    });
  }, [subSelected, range.start, range.end, granularity]);

  const cloudSelect = (p: string) => setSelectedTag(p);
  const toggleSub = (p: string) =>
    setSubSelected((s) =>
      s.includes(p) ? s.filter((x) => x !== p) : [...s, p]
    );
  const toggleAll = (checked: boolean) =>
    setSubSelected(checked ? subs.map((i) => i.tagPath) : []);

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

  const columns = useMemo(
    () => subSelected.map((p) => ({ key: p, label: p.split(".").pop() ?? p })),
    [subSelected]
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Interés por temas
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nube de etiquetas, chips térmicos y tendencia por subtag
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

          <select
            className="
              rounded-lg px-3 py-1.5 text-sm
              border border-gray-200 dark:border-white/10
              bg-white/70 dark:bg-[#14181e]
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
      </div>

      {/* Cloud + Chips */}
      <div className="px-5 pt-4 pb-2">
        <div
          className="
            rounded-xl px-4 py-3
            dark:border-white/10
          "
        >
          <WordCloudHeat
            items={top}
            onSelect={cloudSelect}
            selected={selectedTag}
          />
        </div>

        <div className="mt-3">
          <HeatChips
            items={top}
            onSelect={cloudSelect}
            selected={selectedTag}
          />
        </div>
      </div>

      {/* Panel inferior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 pb-5">
        {/* Izquierda: checklist */}
        <div
          className="
            md:col-span-1 rounded-xl px-4 py-4
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#14181e]
          "
        >
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Subtags {selectedTag ? `de ${selectedTag}` : ""}
          </h3>
          <SubtagChecklist
            items={subs}
            selected={subSelected}
            onToggle={toggleSub}
            onToggleAll={toggleAll}
          />
        </div>

        {/* Derecha: línea comparativa */}
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
