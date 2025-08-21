"use client";
import type { TagCountItem } from "@/lib/analytics/adapter";
import { scaleHeat } from "@/lib/analytics/utils";

type Props = {
  items: TagCountItem[];
  onSelect: (tagPath: string) => void;
  selected?: string | null;
};

export default function HeatChips({ items, onSelect, selected }: Props) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const min = Math.min(...items.map((i) => i.count));

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const color = scaleHeat(it.count, min, max);
        const active = selected === it.tagPath;
        return (
          <button
            key={it.tagPath}
            onClick={() => onSelect(it.tagPath)}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors shadow-sm ${
              active
                ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-400"
                : ""
            }`}
            style={{ backgroundColor: color, color: "white", borderColor: "transparent" }}
            title={`${it.label}: ${it.count}`}
          >
            {it.label} · {it.count}
          </button>
        );
      })}
    </div>
  );
}
