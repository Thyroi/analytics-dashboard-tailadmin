// src/features/chatbot/components/tags/DonutTopShareCard.tsx
"use client";

import PieChart, { type PieDatum } from "@/components/charts/PieChart";
import { TAG_COLOR_HEX_BY_LABEL } from "@/lib/mockData";
import * as React from "react";
import type { TagMetaEntry } from "../../../../components/common/TagsDrawer";

export default function DonutTopShareCard({
  rows,
  tagMeta,
  defaultTagMeta,
  title = "Participación por tag",
  subtitle = "Top actual",
  height = 240,
}: {
  rows: { tag: string; total: number }[];
  tagMeta: Record<string, TagMetaEntry>;
  defaultTagMeta: TagMetaEntry;
  title?: string;
  subtitle?: string;
  height?: number;
}) {
  const data: PieDatum[] = React.useMemo(() => {
    return rows.map(({ tag, total }) => {
      const meta = tagMeta[tag] ?? defaultTagMeta;
      return { label: meta.label, value: total };
    });
  }, [rows, tagMeta, defaultTagMeta]);

  const colorsByLabel = React.useMemo(() => TAG_COLOR_HEX_BY_LABEL, []);

  const total = React.useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data]
  );

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e] p-4 shadow-sm">
      {/* Header compacto */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total del grupo:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {Intl.NumberFormat().format(total)}
          </span>
        </div>
      </div>

      {/* Donut: menos aire arriba/abajo */}
      <div className="flex-1 min-h-[200px] py-1 flex items-center justify-center">
        <PieChart
          data={data}
          type="donut"
          height={height}
          colorsByLabel={colorsByLabel}
          showLegend={false}
          compactHover
          className="w-full"
        />
      </div>

      {/* Leyenda externa con % correcto */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
        {data.map(({ label, value }) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          const color = colorsByLabel[label] ?? "#CBD5E1";
          return (
            <div
              key={label}
              className="flex items-center gap-2 text-sm min-w-0"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="truncate text-gray-700 dark:text-gray-200">
                {label}
              </span>
              <span className="ml-auto tabular-nums text-gray-500 dark:text-gray-400">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
