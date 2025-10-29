"use client";

import DonutCard, {
  type DonutCardItem,
} from "@/components/dashboard/DonutCard";
import type { DonutDatum } from "@/lib/types";
import { useMemo } from "react";

type DonutSectionProps = {
  donutData: DonutDatum[] | undefined;
  onSliceClick?: (label: string) => void;
  centerLabel?: string;
  centerValueOverride?: number;
  actionButtonTarget?: string;
  title?: string;
  titleColor?: string;
  showActivityButton?: boolean;
};

export default function DonutSection({
  donutData,
  onSliceClick,
  centerLabel,
  centerValueOverride,
  actionButtonTarget,
  title = "Subcategorías",
  titleColor = "text-gray-700",
  showActivityButton = true,
}: DonutSectionProps) {
  const items = useMemo<DonutCardItem[]>(
    () =>
      (donutData ?? []).map((d) => ({
        label: d.label,
        value: d.value,
        color: d.color,
      })),
    [donutData]
  );

  // Mapa de label formateado -> id original (URL)
  const labelToId = useMemo(() => {
    const map = new Map<string, string>();
    (donutData ?? []).forEach((d) => {
      if (d.id) {
        map.set(d.label, d.id);
      }
    });
    return map;
  }, [donutData]);

  // Wrapper para el click: si hay id, usarlo en lugar del label
  const handleSliceClick = (label: string) => {
    if (!onSliceClick) return;
    const originalId = labelToId.get(label);
    onSliceClick(originalId || label);
  };

  return (
    <div className="w-full min-h-[420px] flex">
      <DonutCard
        items={items}
        onSliceClick={onSliceClick ? handleSliceClick : undefined}
        title={title}
        titleClassName={titleColor}
        centerTitle={centerLabel}
        centerValueOverride={centerValueOverride}
        actionHref={showActivityButton ? actionButtonTarget : undefined}
        height={420}
        className="w-full"
      />
    </div>
  );
}
