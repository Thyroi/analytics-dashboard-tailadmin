"use client";

import type { TagCountItem } from "@/lib/analytics/adapter";
import { scaleHeat } from "@/lib/analytics/utils";
import { useMemo } from "react";

type Props = {
  items: TagCountItem[];
  selected: string[];
  onToggle: (tagPath: string) => void;
  onToggleAll: (checked: boolean) => void;
};

export default function SubtagChecklist({
  items,
  selected,
  onToggle,
  onToggleAll,
}: Props) {
  const { min, max } = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 1 };
    const vals = items.map((i) => i.count);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [items]);

  const allChecked = items.length > 0 && selected.length === items.length;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
        Seleccionar todo
      </label>

      <ul className="space-y-2 max-h-72 overflow-auto pr-1">
        {items.map((it) => {
          const checked = selected.includes(it.tagPath);
          const pct = max > 0 ? Math.round((it.count / max) * 100) : 0;
          const color = scaleHeat(it.count, min, max);
          return (
            <li key={it.tagPath} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(it.tagPath)}
                  />
                  <span className="capitalize">{it.label}</span>
                </label>
                <div className="text-xs tabular-nums text-gray-500">
                  {it.count}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
