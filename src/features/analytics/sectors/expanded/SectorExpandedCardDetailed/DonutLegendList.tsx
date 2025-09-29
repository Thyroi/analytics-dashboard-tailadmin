"use client";

import * as React from "react";
import { motion } from "motion/react";

type Item = {
  label: string;
  value: number;    // porcentaje (0–100) o valor bruto si pasas `total`
  color: string;
};

type Props = {
  items: Item[];
  /** Si pasas `total`, el % = value/total*100. Si no, suma de values. */
  total?: number;
  /** Elemento seleccionado (solo modo interactivo). */
  selectedLabel?: string | null;
  /** Si está presente => modo interactivo (botones). */
  onSelect?: (label: string) => void;
  /** Columnas del grid (1 o 2). */
  columns?: 1 | 2;
  className?: string;
};

function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}

export default function DonutLegendList({
  items,
  total,
  selectedLabel = null,
  onSelect,
  columns = 2,
  className = "",
}: Props) {
  const sum = React.useMemo(
    () =>
      typeof total === "number"
        ? total
        : items.reduce(
            (a, b) => a + (Number.isFinite(b.value) ? b.value : 0),
            0
          ),
    [items, total]
  );

  const interactive = typeof onSelect === "function";

  // ------ MODO INTERACTIVO (botones con hover/selección)
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

  // ------ MODO ESTÁTICO (lista limpia como en el diseño)
  return (
    <div
      className={[
        "mt-4 grid gap-2",
        // En estático suele verse mejor a 1 columna; respeta `columns` si lo pasas.
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
