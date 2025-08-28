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

  /** Máximo de filas visibles (si no usas maxHeightPx) */
  maxVisible?: number;          // default: 5
  /** Alto por fila (para calcular maxVisible) */
  rowHeightPx?: number;         // default: 36
  /** Alto máximo absoluto de la lista (gana sobre maxVisible) */
  maxHeightPx?: number;         // default: 270
  /** Si true, el header (título + total) queda fijo al hacer scroll */
  stickyHeader?: boolean;       // default: true
  /** Click opcional sobre item */
  onItemClick?: (row: SubtagRow) => void;
};

export default function SubtagsList({
  title = "Issue type",
  totalLabel = "Total count",
  rows,
  colorsByLabel,
  totalVisible,
  className = "",
  maxVisible = 5,
  rowHeightPx = 36,
  maxHeightPx,
  stickyHeader = true,
  onItemClick,
}: Props) {
  const HeaderBlock = (
    <div className={stickyHeader ? "sticky top-0 z-10 bg-white dark:bg-[#14181e]" : undefined}>
      <div className="flex items-center justify-between pb-2 pt-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {totalLabel}{" "}
          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
            {Intl.NumberFormat().format(totalVisible)}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-white/10" />
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className={className}>
        {HeaderBlock}
        <div className="py-3 text-sm text-gray-500 dark:text-gray-400">No subtags found.</div>
      </div>
    );
  }

  // ¿Hace falta scroll?
  const visibleCap = Math.max(1, maxVisible);
  const totalHeight = rows.length * rowHeightPx;
  const capHeight = typeof maxHeightPx === "number" ? maxHeightPx : visibleCap * rowHeightPx;
  const needsScroll =
    typeof maxHeightPx === "number"
      ? totalHeight > maxHeightPx
      : rows.length > visibleCap;

  return (
    <div className={className}>
      {HeaderBlock}

      <div
        className={needsScroll ? "mt-2 overflow-y-auto" : "mt-2 overflow-visible"}
        style={needsScroll ? { maxHeight: capHeight } : undefined}
        aria-label="Subtags list"
      >
        <ul className="divide-y divide-transparent pt-2" role="list">
          {rows.map((row) => {
            const color = colorsByLabel[row.label] ?? "#9CA3AF";
            return (
              <li
                key={row.key}
                className="flex items-center justify-between gap-4 py-1.5"
                style={{ minHeight: rowHeightPx }}
                onClick={() => onItemClick?.(row)}
                role={onItemClick ? "button" : undefined}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px] border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm text-gray-800 dark:text-gray-100" title={row.label}>
                    {row.label}
                  </span>
                </div>
                <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">
                  {Intl.NumberFormat().format(row.total)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
