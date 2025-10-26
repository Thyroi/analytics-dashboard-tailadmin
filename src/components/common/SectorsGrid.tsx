"use client";

import DeltaCard from "@/components/common/DeltaCard";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import type { IconOrImage } from "@/lib/utils/core/images";
import {
  orderIdsByTaxonomy,
  sectorIconSrc,
  sectorTitle,
} from "@/lib/utils/core/sector";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";

// Import the expanded cards based on variant
import SectorExpandedCardDetailed from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed";
import SectorExpandedCard from "@/features/home/sectors/SectorExpandedCard";

type Mode = "tag" | "town";

type BaseProps = {
  mode: Mode;
  ids: string[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;

  getSeriesFor: (id: string) => {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  getDonutFor: (id: string) => DonutDatum[];
  /** puede devolver null (no formateado) */
  getDeltaPctFor: (id: string) => number | null;
  /** Opcional: artifact completo */
  getDeltaArtifactFor?: (id: string) => DeltaArtifact | null;

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  /** Loader en aro + delta oculto */
  isDeltaLoading?: boolean;

  /** Fechas del contexto (para mostrar en header de la card expandida) */
  startDate?: Date;
  endDate?: Date;
};

// Props específicas para la variante detallada
type DetailedProps = BaseProps & {
  variant: "detailed";
  onSliceClick?: (label: string) => void;

  /** Nivel 2 data - si se pasa, se renderiza el drilldown */
  level2Data?: {
    townId: TownId;
    categoryId: CategoryId;
    granularity: Granularity;
    startISO?: string;
    endISO?: string;
  };
};

// Props para la variante simple
type SimpleProps = BaseProps & {
  variant?: "simple";
};

type Props = DetailedProps | SimpleProps;

const ROW_H = 260;

export default function SectorsGrid(props: Props) {
  const {
    mode,
    ids,
    granularity,
    getSeriesFor,
    getDonutFor,
    getDeltaPctFor,
    getDeltaArtifactFor,
    expandedId: controlledExpandedId,
    onOpen,
    onClose,
    startDate,
    endDate,
    isDeltaLoading = false,
  } = props;

  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const expandedRef = useRef<HTMLDivElement | null>(null);

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);
  const handleClose = () => (onClose ? onClose() : setUncontrolled(null));

  const orderedIds = useMemo(() => orderIdsByTaxonomy(mode, ids), [mode, ids]);

  // Auto-scroll cuando aparece el expandido (solo para variante detailed)
  useEffect(() => {
    if (!expandedId || props.variant !== "detailed") return;
    const t = setTimeout(() => {
      expandedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    return () => clearTimeout(t);
  }, [expandedId, props.variant]);

  return (
    <div
      className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
    >
      {orderedIds.map((id) => {
        const title = sectorTitle(mode, id);
        const imgSrc = sectorIconSrc(mode, id);
        const variant: IconOrImage =
          imgSrc !== undefined
            ? { imgSrc }
            : {
                Icon: MapPinIcon as React.ComponentType<
                  React.SVGProps<SVGSVGElement>
                >,
              };

        const deltaPct = getDeltaPctFor(id);
        const deltaArtifact = getDeltaArtifactFor?.(id) ?? undefined;
        const isExpanded = expandedId === id;

        return (
          <div key={id} className={isExpanded ? "col-span-full" : ""}>
            {isExpanded ? (
              <div ref={expandedRef}>
                {props.variant === "detailed" ? (
                  <SectorExpandedCardDetailed
                    key={
                      props.level2Data
                        ? `${id}-${props.level2Data.townId}-${props.level2Data.categoryId}-${props.level2Data.granularity}`
                        : id
                    }
                    title={title}
                    deltaPct={deltaPct}
                    current={getSeriesFor(id).current}
                    previous={getSeriesFor(id).previous}
                    donutData={getDonutFor(id)}
                    onClose={handleClose}
                    onSliceClick={props.onSliceClick}
                    granularity={granularity}
                    onGranularityChange={props.onGranularityChange}
                    startDate={startDate || new Date()}
                    endDate={endDate || new Date()}
                    onRangeChange={() => {}} // Placeholder
                    onClearRange={() => {}} // Placeholder
                    level2={
                      props.level2Data
                        ? {
                            townId: props.level2Data.townId,
                            categoryId: props.level2Data.categoryId,
                            granularity: props.level2Data.granularity,
                            startISO: props.level2Data.startISO,
                            endISO: props.level2Data.endISO,
                          }
                        : undefined
                    }
                    {...variant}
                  />
                ) : (
                  <SectorExpandedCard
                    title={title}
                    deltaPct={deltaPct ?? 0}
                    current={getSeriesFor(id).current}
                    previous={getSeriesFor(id).previous}
                    donutData={getDonutFor(id)}
                    onClose={handleClose}
                    granularity={granularity}
                    {...variant}
                  />
                )}
              </div>
            ) : "imgSrc" in variant ? (
              <DeltaCard
                title={title}
                deltaPct={deltaPct}
                deltaArtifact={deltaArtifact}
                onClick={() => handleOpen(id)}
                loading={isDeltaLoading}
                imgSrc={
                  typeof variant.imgSrc === "string"
                    ? variant.imgSrc
                    : variant.imgSrc?.src || ""
                }
              />
            ) : (
              <DeltaCard
                title={title}
                deltaPct={deltaPct}
                deltaArtifact={deltaArtifact}
                onClick={() => handleOpen(id)}
                loading={isDeltaLoading}
                Icon={variant.Icon}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
