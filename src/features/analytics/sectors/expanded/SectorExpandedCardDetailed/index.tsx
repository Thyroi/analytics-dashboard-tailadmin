"use client";

import React, { useEffect, useMemo, useState } from "react";
import RangeControls from "@/components/dashboard/RangeControls";
import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import Breadcrumb from "./Breadcrumb";

import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_META } from "@/lib/taxonomy/towns";
import {
  CATEGORY_META,
  CATEGORY_ID_ORDER,
  type CategoryId,
} from "@/lib/taxonomy/categories";

/* helpers */
function resolveCategoryIdFromLabel(labelOrId: string): CategoryId | null {
  const x = labelOrId.trim().toLowerCase();
  if (CATEGORY_ID_ORDER.includes(x as CategoryId)) return x as CategoryId;
  for (const id of CATEGORY_ID_ORDER) {
    if (CATEGORY_META[id].label.toLowerCase() === x) return id;
  }
  return null;
}

/* props */
type BaseProps = {
  title: string;
  deltaPct: number;
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

  /** Comportamiento "nativo" de municipios (Home/Analytics by town) */
  isTown?: boolean;
  townId?: TownId;

  /** Callback para el donut superior cuando NO es municipio */
  onSliceClick?: (label: string) => void;

  /**
   * 🔧 Forzar panel de drilldown aunque el card no sea “town”.
   * Útil en Analytics-by-Tag cuando el usuario escoge un pueblo.
   */
  forceDrillTownId?: TownId;
  /** 🔧 Fijar la categoría del drilldown (p.ej., la categoría del card en Analytics-by-Tag) */
  fixedCategoryId?: CategoryId;
};
type WithIcon = { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; imgSrc?: never };
type WithImage = { imgSrc: string | { src: string }; Icon?: never };
type Props = BaseProps & (WithIcon | WithImage);

/* component */
export default function SectorExpandedCardDetailed(props: Props) {
  const {
    title, deltaPct, granularity, onGranularityChange,
    startDate, endDate, onRangeChange, onClearRange,
    current, previous, donutData, onClose,
    isTown = false, townId, onSliceClick,
    forceDrillTownId, fixedCategoryId,
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

  /**
   * Determina el "town" para el panel de drilldown:
   * - Si viene forceDrillTownId, úsalo siempre (modo Analytics-by-Tag)
   * - Si no, usa townId solo cuando isTown=true (modo municipios)
   */
  const drillTownId: TownId | null = forceDrillTownId ?? (isTown ? townId ?? null : null);

  // estado drilldown (solo se usa cuando NO viene fixedCategoryId)
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);

  // si cambia el pueblo (nativo) reseteamos; en modo “forzado” lo controla el padre
  useEffect(() => {
    if (forceDrillTownId) return;
    setSelectedCategoryId(null);
  }, [townId, forceDrillTownId]);

  // si el padre fija la categoría (Analytics-by-Tag), sincronízala
  useEffect(() => {
    if (fixedCategoryId) setSelectedCategoryId(fixedCategoryId);
  }, [fixedCategoryId]);

  const {
    loading: ddLoading,
    xLabels: ddXLabels,
    series: ddSeries,
    donut: ddDonut,
    deltaPct: ddDeltaPct,
    seriesByUrl: ddSeriesByUrl,
  } = useTownCategoryDrilldown(
    drillTownId
      ? {
          townId: drillTownId,
          categoryId: (fixedCategoryId ?? selectedCategoryId) ?? null,
          granularity,
        }
      : null
  );

  const handleDonutTopClick = (label: string) => {
    // si el padre fijó categoría, ignoramos clicks del donut superior
    if (fixedCategoryId) return;

    // modo municipio: el donut superior muestra categorías → resolvemos categoría
    if (isTown && drillTownId) {
      const cid = resolveCategoryIdFromLabel(label);
      if (cid) setSelectedCategoryId(cid);
      return;
    }
    // modo categoría: deja pasar el click al padre (abre pueblo)
    if (onSliceClick) onSliceClick(label);
  };

  const crumbs = useMemo(() => {
    if (!drillTownId) return [];
    const root = {
      label: TOWN_META[drillTownId].label,
      onClick: fixedCategoryId ? undefined : () => setSelectedCategoryId(null),
    };
    const cid = fixedCategoryId ?? selectedCategoryId;
    if (!cid) return [root];
    return [root, { label: CATEGORY_META[cid].label }];
  }, [drillTownId, fixedCategoryId, selectedCategoryId]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <Header title={title} isTown={isTown} imgSrc={imgSrc} Icon={Icon} onClose={onClose} />

      <RangeControls
        mode="granularity"
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
        onClearRange={onClearRange}
        className="mb-3"
      />

      {/* Resumen superior (siempre el que llega por props) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartSection categories={categories} currData={currData} prevData={prevData} />
        <DonutSection donutData={donutData} deltaPct={deltaPct} onSliceClick={handleDonutTopClick} />
      </div>

      {/* Panel de drilldown persistente si hay pueblo para consultar (nativo o forzado) */}
      {drillTownId && (
        <div className="mt-4 space-y-3">
          <Breadcrumb segments={crumbs} />

          {!(fixedCategoryId ?? selectedCategoryId) && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-3 text-sm">
              Haz click en un sector del donut de arriba para desglosar <b>categorías</b> dentro de {TOWN_META[drillTownId].label}.
            </div>
          )}

          {(fixedCategoryId ?? selectedCategoryId) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <DrilldownMultiLineSection
                xLabels={ddXLabels}
                seriesBySub={ddSeriesByUrl}
                loading={ddLoading}
              />
              <DonutSection
                donutData={ddDonut}
                deltaPct={ddDeltaPct}
                onSliceClick={(sub) => {
                  // siguiente nivel (URL) – trazado
                  // eslint-disable-next-line no-console
                  console.log("Sub-actividad seleccionada:", sub);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
