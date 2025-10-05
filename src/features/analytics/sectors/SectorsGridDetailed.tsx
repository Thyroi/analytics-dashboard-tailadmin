"use client";

import DeltaCard from "@/components/common/DeltaCard";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import {
  orderIdsByTaxonomy,
  sectorIconSrc,
  sectorTitle,
} from "@/lib/utils/sector";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import SectorExpandedCardDetailed from "../sectors/expanded/SectorExpandedCardDetailed";

type Mode = "tag" | "town";

type Props = {
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

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  onSliceClick?: (label: string) => void;

  startDate?: Date;
  endDate?: Date;

  /** para modo "tag" con drilldown forzado */
  forceDrillTownId?: TownId;
  fixedCategoryId?: CategoryId;

  /** Loader en aro + delta oculto */
  isDeltaLoading?: boolean;
};

const ROW_H = 260;

export default function SectorsGridDetailed({
  mode,
  ids,
  granularity,
  onGranularityChange,
  getSeriesFor,
  getDonutFor,
  getDeltaPctFor,
  expandedId: controlledExpandedId,
  onOpen,
  onClose,
  onSliceClick,
  startDate,
  endDate,
  forceDrillTownId,
  fixedCategoryId,
  isDeltaLoading = false,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const expandedRef = useRef<HTMLDivElement | null>(null);

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);
  const handleClose = () => (onClose ? onClose() : setUncontrolled(null));

  const orderedIds = useMemo(() => orderIdsByTaxonomy(mode, ids), [mode, ids]);
  const isTown = mode === "town";
  const now = new Date();

  // Auto-scroll cuando aparece el expandido (nivel 1)
  useEffect(() => {
    if (!expandedId) return;
    const t = setTimeout(() => {
      expandedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [expandedId]);

  return (
    <div
      className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
    >
      {orderedIds.map((id) => {
        const title = sectorTitle(mode, id);
        const imgSrc = sectorIconSrc(mode, id);
        const variant =
          imgSrc !== undefined
            ? { imgSrc }
            : {
                Icon: MapPinIcon as React.ComponentType<
                  React.SVGProps<SVGSVGElement>
                >,
              };

        const deltaPct = getDeltaPctFor(id);

        if (expandedId === id) {
          const s = getSeriesFor(id);
          const donutData = getDonutFor(id);
          return (
            <div
              key={`expanded-${id}`}
              ref={expandedRef}
              className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-2 scroll-mt-24"
            >
              <SectorExpandedCardDetailed
                title={title}
                deltaPct={deltaPct ?? 0}
                granularity={granularity}
                onGranularityChange={onGranularityChange}
                startDate={startDate ?? now}
                endDate={endDate ?? now}
                onRangeChange={() => {}}
                onClearRange={() => {}}
                current={s.current}
                previous={s.previous}
                donutData={donutData}
                onClose={handleClose}
                isTown={isTown}
                onSliceClick={onSliceClick}
                forceDrillTownId={forceDrillTownId}
                fixedCategoryId={fixedCategoryId}
                {...variant}
              />
            </div>
          );
        }

        return (
          <div key={id} className="row-span-1">
            <DeltaCard
              title={title}
              deltaPct={deltaPct}
              height={ROW_H}
              ringSize={96}
              ringThickness={8}
              expanded={false}
              onClick={() => handleOpen(id)}
              className="h-full"
              isTown={isTown}
              loading={isDeltaLoading}
              {...variant}
            />
          </div>
        );
      })}
    </div>
  );
}
