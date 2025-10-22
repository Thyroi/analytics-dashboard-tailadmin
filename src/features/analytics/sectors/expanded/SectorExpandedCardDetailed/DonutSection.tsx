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

  return (
    <div className="w-full min-h-[420px] flex">
      <DonutCard
        items={items}
        onSliceClick={onSliceClick}
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
