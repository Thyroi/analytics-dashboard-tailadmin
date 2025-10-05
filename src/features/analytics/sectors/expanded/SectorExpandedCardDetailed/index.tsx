"use client";

import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { resolveCategoryIdFromLabel } from "@/lib/utils/drilldown";
import { IconOrImage } from "@/lib/utils/images";
import { useEffect, useMemo, useState } from "react";
import ChartPair from "./ChartPair";
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
  isTown?: boolean;
  townId?: TownId;
  onSliceClick?: (label: string) => void;
  forceDrillTownId?: TownId;
  fixedCategoryId?: CategoryId;
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
    isTown = false,
    townId,
    onSliceClick,
    forceDrillTownId,
    fixedCategoryId,
  } = props;

  const { categories, currData, prevData } = useMemo(() => {
    const n = Math.min(current.length, previous.length);
    return {
      categories: current.slice(-n).map((p) => p.label),
      currData: current.slice(-n).map((p) => p.value),
      prevData: previous.slice(-n).map((p) => p.value),
    };
  }, [current, previous]);

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;
  const Icon = "Icon" in props ? props.Icon : undefined;

  const drillTownId: TownId | null =
    forceDrillTownId ?? (isTown ? townId ?? null : null);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  useEffect(() => {
    if (forceDrillTownId) return;
    setSelectedCategoryId(null);
  }, [townId, forceDrillTownId]);

  useEffect(() => {
    if (fixedCategoryId) setSelectedCategoryId(fixedCategoryId);
  }, [fixedCategoryId]);

  const handleDonutTopClick = (label: string) => {
    if (isTown && drillTownId) {
      const cid = resolveCategoryIdFromLabel(label);
      if (cid) setSelectedCategoryId(cid);
      return;
    }
    if (onSliceClick) onSliceClick(label);
  };

  return (
    <div>
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
        onDonutSlice={handleDonutTopClick}
        donutCenterLabel={isTown ? "Categorías" : "Pueblos"}
        actionButtonTarget={isTown ? "categoría" : "pueblo"}
        className="mb-4"
      />

      {drillTownId && (fixedCategoryId ?? selectedCategoryId) && (
        <TownCategoryDrilldownPanel
          townId={drillTownId}
          categoryId={(fixedCategoryId ?? selectedCategoryId)!}
          granularity={granularity}
          headline={isTown ? "category" : "town"}
        />
      )}
    </div>
  );
}
