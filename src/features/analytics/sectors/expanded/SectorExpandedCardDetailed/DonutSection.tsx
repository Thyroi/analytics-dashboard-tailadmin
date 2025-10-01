"use client";

import DonutCard, {
  type DonutCardItem,
} from "@/components/dashboard/DonutCard";
import type { DonutDatum } from "@/lib/types";
import { useMemo } from "react";

type DonutSectionProps = {
  donutData: DonutDatum[];
  onSliceClick?: (label: string) => void;
  centerLabel?: string;
  centerValueOverride?: number;
  actionButtonTarget?: string;
  title?: string;
  /** Clase de Tailwind para el título (p. ej. "text-gray-700").
   *  Si necesitas soportar HEX directo, avísame y añadimos `titleStyle` al Header. */
  titleColor?: string;
};

export default function DonutSection({
  donutData,
  onSliceClick,
  centerLabel,
  centerValueOverride,
  actionButtonTarget,
  title = "Subcategorías",
  titleColor = "text-gray-700",
}: DonutSectionProps) {
  // Adaptamos tus datos al contrato de DonutCard
  const items = useMemo<DonutCardItem[]>(
    () =>
      donutData.map((d) => ({
        label: d.label,
        value: d.value,
        color: d.color,
      })),
    [donutData]
  );

  return (
    <DonutCard
      items={items}
      onSliceClick={onSliceClick}
      title={title}
      titleClassName={titleColor}
      centerTitle={centerLabel}
      centerValueOverride={centerValueOverride}
      actionHref={actionButtonTarget}
      height={180}
    />
  );
}
