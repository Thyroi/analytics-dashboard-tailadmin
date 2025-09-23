"use client";

import React, { useMemo } from "react";
import RangeControls from "@/components/dashboard/RangeControls";
import type { Granularity, SeriesPoint, DonutDatum } from "@/lib/types";

import Header from "./Header";
import ChartSection from "./ChartSection";
import DonutSection from "./DonutSection";

type BaseProps = {
  title: string;
  deltaPct: number;
  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  current: SeriesPoint[];
  previous: SeriesPoint[];
  donutData: DonutDatum[];
  onClose: () => void;
  isTown?: boolean;
};

type WithIcon = { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; imgSrc?: never };
type WithImage = { imgSrc: string | { src: string }; Icon?: never };

type Props = BaseProps & (WithIcon | WithImage);

export default function SectorExpandedCard(props: Props) {
  const { title, deltaPct, mode, granularity, onGranularityChange, startDate, endDate,
          onRangeChange, onClearRange, current, previous, donutData, onClose, isTown = false } = props;

  const { categories, currData, prevData } = useMemo(() => {
    const n = Math.min(current.length, previous.length);
    return {
      categories: current.slice(-n).map((p) => p.label),
      currData: current.slice(-n).map((p) => p.value),
      prevData: previous.slice(-n).map((p) => p.value),
    };
  }, [current, previous]);

  const imgSrc = "imgSrc" in props
    ? typeof props.imgSrc === "string"
      ? props.imgSrc
      : props.imgSrc?.src
    : undefined;

  const Icon = "Icon" in props ? props.Icon : undefined;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <Header title={title} isTown={isTown} imgSrc={imgSrc} Icon={Icon} onClose={onClose} />

      <RangeControls
        mode={mode}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
        onClearRange={onClearRange}
        className="mb-3"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartSection categories={categories} currData={currData} prevData={prevData} />
        <DonutSection donutData={donutData} deltaPct={deltaPct} />
      </div>
    </div>
  );
}
