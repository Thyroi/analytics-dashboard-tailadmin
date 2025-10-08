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

  /** Fin del rango si estás en modo "range" (YYYY-MM-DD). Opcional. */
  endISO?: string;
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
    endISO,
  } = props;

  const imgSrc =
    "imgSrc" in props
      ? typeof props.imgSrc === "string"
        ? props.imgSrc
        : props.imgSrc?.src
      : undefined;
  const Icon = "Icon" in props ? props.Icon : undefined;

  // Pueblo a drillear (si viene forzado, ese; si no, si esTown, el townId local)
  const drillTownId: TownId | null = useMemo(
    () => forceDrillTownId ?? (isTown ? townId ?? null : null),
    [forceDrillTownId, isTown, townId]
  );

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  // Reset cuando cambia el pueblo (o cuando viene forzado)
  useEffect(() => {
    setSelectedCategoryId(null);
  }, [drillTownId]);

  // Si nos pasan una categoría fija desde fuera, sincroniza selección
  useEffect(() => {
    if (fixedCategoryId) setSelectedCategoryId(fixedCategoryId);
  }, [fixedCategoryId]);

  // Click en dona superior
  const handleDonutTopClick = (label: string) => {
    if (isTown && drillTownId) {
      const cid = resolveCategoryIdFromLabel(label);
      if (cid) setSelectedCategoryId(cid);
      return;
    }
    if (onSliceClick) onSliceClick(label);
  };

  // Auto-scroll a nivel 2 cuando hay selección
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

  // 👇 CLAVE: re-monta el panel de drill cuando cambie selección o rango/granularidad
  const panelKey = useMemo(
    () =>
      `${drillTownId ?? ""}|${
        fixedCategoryId ?? selectedCategoryId ?? ""
      }|${granularity}|${endISO ?? ""}`,
    [drillTownId, fixedCategoryId, selectedCategoryId, granularity, endISO]
  );

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
        <div ref={level2Ref} className="scroll-mt-24">
          <TownCategoryDrilldownPanel
            key={panelKey} // 👈 fuerza refetch/redraw al cambiar porción, rango o granularidad
            townId={drillTownId}
            categoryId={(fixedCategoryId ?? selectedCategoryId)!}
            granularity={granularity}
            headline={isTown ? "category" : "town"}
            endISO={endISO}
          />
        </div>
      )}
    </div>
  );
}
