"use client";

import RangeControls from "@/components/dashboard/RangeControls";
import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import type { Granularity } from "@/lib/types";
import React from "react";

type Props = {
  title: string;
  isTown: boolean;
  imgSrc?: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClose: () => void;

  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  onGranularityChange: (g: Granularity) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  className?: string;
};

export default function ExpandedCardHeader({
  title,
  isTown = false,
  imgSrc,
  Icon,
  onClose,
  granularity,
  startDate,
  endDate,
  onGranularityChange,
  onRangeChange,
  onClearRange,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <Header
        title={title}
        isTown={isTown}
        imgSrc={imgSrc}
        Icon={Icon}
        onClose={onClose}
      />
    </div>
  );
}
