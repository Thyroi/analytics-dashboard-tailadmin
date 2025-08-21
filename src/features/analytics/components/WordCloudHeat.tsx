"use client";
import { scaleHeat, scaleSize } from "@/lib/analytics/utils";
import type { TagCountItem } from "@/lib/analytics/adapter";

type Props = {
  items: TagCountItem[];
  onSelect: (tagPath: string) => void;
  selected?: string | null;
};

export default function WordCloudHeat({ items, onSelect, selected }: Props) {
  const max = Math.max(1, ...items.map(i=>i.count));
  const min = Math.min(...items.map(i=>i.count));

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it)=> {
        const size = scaleSize(it.count, min, max);
        const color = scaleHeat(it.count, min, max);
        const isSel = selected === it.tagPath;
        return (
          <button
            key={it.tagPath}
            title={`${it.label}: ${it.count}`}
            onClick={()=>onSelect(it.tagPath)}
            className={`leading-none transition-all hover:scale-105 ${isSel ? "underline" : ""}`}
            style={{ fontSize: size, color }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
