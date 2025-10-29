"use client";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import React from "react";

import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
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
  totals?: { ga4: number; chatbot: number; total: number } | null;
  isLoading?: boolean;
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
    totals,
    isLoading = false,
  } = props;

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;

  const Icon = "Icon" in props ? props.Icon : undefined;

  // Subtítulo explicativo según el tipo de entidad
  const baseSubtitle = isTown
    ? "Visualizaciones de página por categoría de interés turístico"
    : "Visualizaciones de página distribuidas por municipio";

  // Si hay totales disponibles, agregar la información al subtítulo
  const subtitle = totals
    ? `${baseSubtitle} • GA4: ${totals.ga4.toLocaleString()} • Chatbot: ${totals.chatbot.toLocaleString()} • Total: ${totals.total.toLocaleString()}`
    : baseSubtitle;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-orange-50 dark:bg-gray-900/50 p-3 shadow-sm w-full">
      <Header
        title={title}
        subtitle={subtitle}
        isTown={isTown}
        imgSrc={imgSrc}
        Icon={Icon}
        onClose={onClose}
      />

      {isLoading ? (
        <ChartPairSkeleton />
      ) : (
        <ChartPair
          mode="line"
          series={{ current, previous }}
          donutData={donutData}
          deltaPct={deltaPct}
          donutCenterLabel="Interacciones"
          actionButtonTarget={isTown ? "categoría" : "pueblo"}
          showActivityButton={false}
          className=""
          granularity={granularity}
        />
      )}
    </div>
  );
}
