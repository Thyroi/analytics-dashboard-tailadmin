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
  const visibleDonutData = useMemo(() => {
    const positiveItems = (donutData ?? []).filter(
      (item) => Number.isFinite(item.value) && item.value > 0,
    );
    const total = positiveItems.reduce((sum, item) => sum + item.value, 0);

    if (total <= 0) return [] as DonutDatum[];

    return positiveItems.filter((item) => {
      const pct = (item.value / total) * 100;
      return Number(pct.toFixed(2)) > 0;
    });
  }, [donutData]);

  const items = useMemo<DonutCardItem[]>(
    () =>
      visibleDonutData.map((d) => ({
        label: d.label,
        value: d.value,
        color: d.color,
      })),
    [visibleDonutData],
  );

  // Mapa de label formateado -> id original (URL)
  const labelToId = useMemo(() => {
    const map = new Map<string, string>();
    visibleDonutData.forEach((d) => {
      if (d.id) {
        map.set(d.label, d.id);
      }
    });
    return map;
  }, [visibleDonutData]);

  // Wrapper para el click: si hay id, usarlo en lugar del label
  const handleSliceClick = (label: string) => {
    if (!onSliceClick) return;
    const originalId = labelToId.get(label);
    onSliceClick(originalId || label);
  };

  return (
    <div className="w-full h-full min-h-[420px] flex">
      <DonutCard
        items={items}
        onSliceClick={onSliceClick ? handleSliceClick : undefined}
        title={title}
        titleClassName={titleColor}
        centerTitle={centerLabel}
        centerValueOverride={centerValueOverride}
        actionHref={showActivityButton ? actionButtonTarget : undefined}
        height={420}
        className="w-full h-full"
      />
    </div>
  );
}
