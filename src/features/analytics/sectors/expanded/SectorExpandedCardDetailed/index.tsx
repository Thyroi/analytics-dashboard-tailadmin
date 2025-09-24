"use client";

import RangeControls from "@/components/dashboard/RangeControls";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import Header from "@/features/home/sectors/SectorExpandedCard/Header";
import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "./Breadcrumb";

import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";
import { useUrlDrilldown } from "@/features/analytics/hooks/useUrlDrilldown";
import type { UrlSeries } from "@/features/analytics/services/drilldown";

import UrlDetailsPanel from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/UrlDetailsPanel";

import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { TOWN_META } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

/* helpers */
function resolveCategoryIdFromLabel(labelOrId: string): CategoryId | null {
  const x = labelOrId.trim().toLowerCase();
  if (CATEGORY_ID_ORDER.includes(x as CategoryId)) return x as CategoryId;
  for (const id of CATEGORY_ID_ORDER) {
    if (CATEGORY_META[id].label.toLowerCase() === x) return id;
  }
  return null;
}

/** Mapea una sub-actividad seleccionada al path candidato dentro de las series por URL */
function pickPathForSubActivity(
  subLabel: string,
  seriesByUrl: UrlSeries[]
): string | null {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const sub = norm(subLabel);

  // 1) match directo por nombre de serie
  const byName = seriesByUrl.find((s) => norm(s.name).includes(sub));
  if (byName) return byName.path;

  // 2) match por path
  const byPath = seriesByUrl.find(
    (s) => norm(s.path).includes(`/${sub}`) || norm(s.path).endsWith(`/${sub}`)
  );
  if (byPath) return byPath.path;

  // 3) fallback: tomar la de mayor total
  const withTotals = seriesByUrl.map((s) => ({
    path: s.path,
    total: s.data.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
  }));
  withTotals.sort((a, b) => b.total - a.total);
  return withTotals.length > 0 ? withTotals[0].path : null;
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
type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};
type WithImage = { imgSrc: string | { src: string }; Icon?: never };
type Props = BaseProps & (WithIcon | WithImage);

/* component */
export default function SectorExpandedCardDetailed(props: Props) {
  const {
    title,
    deltaPct,
    granularity,
    onGranularityChange,
    startDate,
    endDate,
    onRangeChange,
    onClearRange,
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

  /**
   * Determina el "town" para el panel de drilldown:
   * - Si viene forceDrillTownId, úsalo siempre (modo Analytics-by-Tag)
   * - Si no, usa townId solo cuando isTown=true (modo municipios)
   */
  const drillTownId: TownId | null =
    forceDrillTownId ?? (isTown ? townId ?? null : null);

  // estado drilldown (solo se usa cuando NO viene fixedCategoryId)
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  // estado para URL seleccionada (nivel 3)
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // si cambia el pueblo (nativo) reseteamos; en modo “forzado” lo controla el padre
  useEffect(() => {
    if (forceDrillTownId) return;
    setSelectedCategoryId(null);
  }, [townId, forceDrillTownId]);

  // si el padre fija la categoría (Analytics-by-Tag), sincronízala
  useEffect(() => {
    if (fixedCategoryId) setSelectedCategoryId(fixedCategoryId);
  }, [fixedCategoryId]);

  // limpiar URL seleccionada cuando cambie el contexto town+cat
  useEffect(() => {
    setSelectedPath(null);
  }, [drillTownId, selectedCategoryId, fixedCategoryId]);

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
          categoryId: fixedCategoryId ?? selectedCategoryId ?? null,
          granularity,
        }
      : null
  );

  // Hook del nivel 3 (URL details)
  const {
    loading: urlLoading,
    seriesAvgEngagement,
    kpis,
    operatingSystems,
    genders,
    countries,
    deltaPct: urlDeltaPct,
    selectedPath: confirmedPath,
  } = useUrlDrilldown({ path: selectedPath, granularity });

  const handleDonutTopClick = (label: string) => {
    // MODO MUNICIPIO (isTown=true): el donut superior muestra CATEGORÍAS
    if (isTown && drillTownId) {
      const cid = resolveCategoryIdFromLabel(label);
      if (cid) setSelectedCategoryId(cid);
      return;
    }

    // MODO CATEGORÍA (isTown=false): el donut superior muestra PUEBLOS
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
      <Header
        title={title}
        isTown={isTown}
        imgSrc={imgSrc}
        Icon={Icon}
        onClose={onClose}
      />

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
        <ChartSection
          categories={categories}
          currData={currData}
          prevData={prevData}
        />
        <DonutSection
          donutData={donutData}
          deltaPct={deltaPct}
          onSliceClick={handleDonutTopClick}
        />
      </div>

      {/* Panel de drilldown persistente si hay pueblo para consultar (nativo o forzado) */}
      {drillTownId && (
        <div className="mt-4 space-y-3">
          <Breadcrumb segments={crumbs} />

          {!(fixedCategoryId ?? selectedCategoryId) && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 p-3 text-sm">
              Haz click en un sector del donut de arriba para desglosar{" "}
              <b>categorías</b> dentro de {TOWN_META[drillTownId].label}.
            </div>
          )}

          {(fixedCategoryId ?? selectedCategoryId) && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DrilldownMultiLineSection
                  xLabels={ddXLabels}
                  seriesBySub={ddSeriesByUrl}
                  loading={ddLoading}
                />
                <DonutSection
                  donutData={ddDonut}
                  deltaPct={ddDeltaPct}
                  onSliceClick={(subLabel) => {
                    const candidate = pickPathForSubActivity(
                      subLabel,
                      ddSeriesByUrl
                    );
                    if (candidate) setSelectedPath(candidate);
                  }}
                />
              </div>

              {/* Sección 3: URL details (nuevo layout) */}
              {selectedPath && (
                <UrlDetailsPanel
                  path={confirmedPath ?? selectedPath}
                  loading={urlLoading}
                  seriesAvgEngagement={seriesAvgEngagement}
                  kpis={kpis}
                  operatingSystems={operatingSystems}
                  genders={genders}
                  countries={countries}
                  deltaPct={urlDeltaPct}
                  granularity={granularity}
                  onClose={() => setSelectedPath(null)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
