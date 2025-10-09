"use client";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import React from "react";

import ChartPair from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/ChartPair";
import Header from "./Header";

type BaseProps = {
  title: string;
  deltaPct: number;
  current: SeriesPoint[];
  previous: SeriesPoint[];
  donutData: DonutDatum[];
  onClose: () => void;
  isTown?: boolean;
  granularity: Granularity;
};

type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};
type WithImage = { imgSrc: string | { src: string }; Icon?: never };

type Props = BaseProps & (WithIcon | WithImage);

export default function SectorExpandedCard(props: Props) {
  const {
    title,
    deltaPct,
    current,
    previous,
    donutData,
    onClose,
    isTown = false,
    granularity,
  } = props;

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;

  const Icon = "Icon" in props ? props.Icon : undefined;


  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <Header
        title={title}
        isTown={isTown}
        imgSrc={imgSrc}
        Icon={Icon}
        onClose={onClose}
      />

      <ChartPair
        mode="line"
        series={{ current, previous }}
        donutData={donutData}
        deltaPct={deltaPct}
        donutCenterLabel={isTown ? "Categorías" : "Pueblos"}
        actionButtonTarget={isTown ? "categoría" : "pueblo"}
        className=""
        granularity={granularity}
      />
    </div>
  );
}
