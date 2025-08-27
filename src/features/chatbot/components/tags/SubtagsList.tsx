"use client";
import * as React from "react";

export type SubtagRow = { key: string; label: string; total: number };

type Props = {
  title?: string;
  totalLabel?: string;
  rows: SubtagRow[];
  colorsByLabel: Record<string, string>;
  totalVisible: number;
  className?: string;
};

export default function SubtagsList({
  title = "Issue type",
  totalLabel = "Total count",
  rows,
  colorsByLabel,
  totalVisible,
  className = "",
}: Props) {
  return (
    <div className={className}>
      {/* Header de la lista */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {totalLabel}{" "}
          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
            {Intl.NumberFormat().format(totalVisible)}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-white/10" />

      {/* Ítems */}
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-3">No subtags found.</div>
      ) : (
        <ul className="divide-y divide-transparent pt-2">
          {rows.map(({ key, label, total }) => {
            const color = colorsByLabel[label] ?? "#9CA3AF";
            return (
              <li key={key} className="py-1.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px] border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm text-gray-800 dark:text-gray-100">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                  {Intl.NumberFormat().format(total)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
