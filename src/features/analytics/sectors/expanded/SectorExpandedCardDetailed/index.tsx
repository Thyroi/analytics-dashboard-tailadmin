"use client";

import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { resolveCategoryIdFromLabel } from "@/lib/utils/drilldown";
import { IconOrImage } from "@/lib/utils/images";
import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Drill forzado por pueblo (cuando vienes de tag → town) */
  forceDrillTownId?: TownId;
  /** Categoría fija (cuando vienes de town → categoría) */
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

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;
  const Icon = "Icon" in props ? props.Icon : undefined;

  // 🔒 drillTownId estable
  const drillTownId: TownId | null = useMemo(
    () => forceDrillTownId ?? (isTown ? townId ?? null : null),
    [forceDrillTownId, isTown, townId]
  );

  // Nivel 2: categoría seleccionada (solo aplica en modo pueblo)
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  // Reset categoría al cambiar el contexto real del drill (pueblo)
  useEffect(() => {
    setSelectedCategoryId(null);
  }, [drillTownId]);

  // Fijar categoría si viene desde arriba
  useEffect(() => {
    if (fixedCategoryId) setSelectedCategoryId(fixedCategoryId);
  }, [fixedCategoryId]);

  // Click en donut superior
  const handleDonutTopClick = (label: string) => {
    if (isTown && drillTownId) {
      const cid = resolveCategoryIdFromLabel(label);
      if (cid) setSelectedCategoryId(cid);
      return;
    }
    if (onSliceClick) onSliceClick(label);
  };

  // Auto-scroll al montar el panel de nivel 2
  const level2Ref = useRef<HTMLDivElement | null>(null);
  const level2Active = !!(
    drillTownId &&
    (fixedCategoryId ?? selectedCategoryId)
  );
  useEffect(() => {
    if (!level2Active) return;
    const t = setTimeout(() => {
      level2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(t);
  }, [level2Active]);

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
        granularity={granularity}
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
