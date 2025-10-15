"use client";

import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useRef } from "react";

import ChartPair from "@/components/common/ChartPair";
import { IconOrImage } from "@/lib/utils/core/images";
import TownCategoryDrilldownPanel from "./TownCategoryDrilldownPanel";

type BaseProps = {
  title: string;
  deltaPct: number | null;
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
  onSliceClick?: (label: string) => void;

  /** NIVEL 2: Opcional - si se pasa, se renderiza el drilldown */
  level2?: {
    townId: TownId;
    categoryId: CategoryId;
    granularity: Granularity;
    endISO?: string;
  };
};

type Props = BaseProps & IconOrImage;

export default function SectorExpandedCardDetailed(props: Props) {
  const {
    title,
    deltaPct,
    granularity,
    current,
    previous,
    donutData,
    onClose,
    onSliceClick,
    level2,
  } = props;

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;
  const Icon = "Icon" in props ? props.Icon : undefined;

  // Auto-scroll a nivel 2
  const level2Ref = useRef<HTMLDivElement | null>(null);

  const scrollToLevel2 = () => {
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Click en dona - simplemente delegar al parent
  const handleDonutTopClick = (label: string) => {
    if (onSliceClick) {
      onSliceClick(label);
    }
    // Hacer scroll al nivel 2 tras el click (el prop level2 puede llegar en el siguiente render)
    scrollToLevel2();
  };

  return (
    <div>
      <Header
        title={title}
        isTown={false}
        imgSrc={imgSrc}
        Icon={Icon}
        onClose={onClose}
      />

      <ChartPair
        mode="line"
        series={{ current, previous }}
        donutData={donutData}
        deltaPct={deltaPct}
        onDonutSlice={handleDonutTopClick}
        donutCenterLabel="Items"
        actionButtonTarget="item"
        className="mb-4"
        granularity={granularity}
      />

      {level2 && (
        <div ref={level2Ref} className="scroll-mt-24">
          <TownCategoryDrilldownPanel
            key={`${level2.townId}-${level2.categoryId}-${level2.granularity}`}
            townId={level2.townId}
            categoryId={level2.categoryId}
            granularity={level2.granularity}
            headline="category"
            endISO={level2.endISO}
          />
        </div>
      )}
    </div>
  );
}
