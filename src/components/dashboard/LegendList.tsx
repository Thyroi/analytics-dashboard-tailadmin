
"use client";

import { motion } from "motion/react";
import * as React from "react";

export type LegendItem = {
  label: string;
  value: number;
  color: string;
};

type LegendListProps = {
  items: LegendItem[];
  total?: number;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  columns?: 1 | 2;
  className?: string;
};

function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}

export default function LegendList({
  items,
  total,
  selectedLabel = null,
  onSelect,
  columns = 2,
  className = "",
}: LegendListProps) {
  const sum = React.useMemo(() => {
    if (typeof total === "number") return total;
    return items.reduce(
      (acc, it) => acc + (Number.isFinite(it.value) ? it.value : 0),
      0
    );
  }, [items, total]);

  const interactive = typeof onSelect === "function";

  if (interactive) {
    return (
      <div
        className={[
          "mt-4 grid gap-2",
          columns === 1 ? "grid-cols-1" : "grid-cols-2",
          className,
        ].join(" ")}
      >
        {items.map((it) => {
          const isActive = selectedLabel === it.label;
          const pct = sum > 0 ? (it.value / sum) * 100 : 0;

          return (
            <motion.button
              key={it.label}
              whileHover={{ scale: 1.03, x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect?.(it.label)}
              type="button"
              aria-pressed={isActive}
              className={[
                "flex h-10 items-center justify-between rounded-lg border p-2 text-sm transition-all",
                isActive
                  ? "bg-red-100/80 border-red-300 text-red-700 shadow-sm"
                  : "bg-gray-50 hover:bg-red-50 border-gray-200",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: it.color }}
                  aria-hidden
                />
                <span className="truncate">{it.label}</span>
              </div>
              <span className="text-xs font-medium tabular-nums">
                {formatPct(pct)}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={[
        "mt-4 grid gap-2",
        columns === 1 ? "grid-cols-1" : "grid-cols-2",
        className,
      ].join(" ")}
    >
      {items.map((it) => {
        const pct = sum > 0 ? (it.value / sum) * 100 : 0;
        return (
          <div
            key={it.label}
            className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: it.color }}
                aria-hidden
              />
              <span className="truncate text-gray-800">{it.label}</span>
            </div>
            <span className="text-xs font-semibold tabular-nums text-gray-700">
              {formatPct(pct)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
