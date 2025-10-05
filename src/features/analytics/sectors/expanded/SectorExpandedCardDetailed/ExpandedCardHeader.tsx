"use client";

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
