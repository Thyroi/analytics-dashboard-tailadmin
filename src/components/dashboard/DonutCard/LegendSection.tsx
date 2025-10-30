import LegendList, { type LegendItem } from "@/components/dashboard/LegendList";
import { useMemo } from "react";
import type { DonutCardItem } from "./types";

type LegendSectionProps = {
  items: DonutCardItem[];
  isEmpty: boolean;
  colorsByLabel: Record<string, string>;
  interactive: boolean;
  selectedLabel: string | null;
  autoColumns: number;
  onSelect: (label: string) => void;
};

export function LegendSection({
  items,
  isEmpty,
  colorsByLabel,
  interactive,
  selectedLabel,
  autoColumns,
  onSelect,
}: LegendSectionProps) {
  const legendItems: LegendItem[] = useMemo(() => {
    if (isEmpty) return [];
    return items.map((d) => ({
      label: d.label,
      value: d.value,
      color: colorsByLabel[d.label],
    }));
  }, [isEmpty, items, colorsByLabel]);

  if (isEmpty) return null;

  return (
    <LegendList
      items={legendItems}
      {...(interactive
        ? {
            selectedLabel,
            onSelect,
            columns: autoColumns as 1 | 2,
          }
        : { columns: autoColumns as 1 | 2 })}
      className="mt-4"
    />
  );
}
