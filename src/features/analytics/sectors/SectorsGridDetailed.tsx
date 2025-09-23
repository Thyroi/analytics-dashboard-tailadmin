"use client";

import { useMemo, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";
import SectorDeltaCard from "@/features/home/sectors/SectorDeltaCard";
import SectorExpandedCardDetailed from "../sectors/expanded/SectorExpandedCardDetailed";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import {
  CATEGORY_META,
  CATEGORY_ID_ORDER,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import {
  TOWN_META,
  TOWN_ID_ORDER,
  type TownId,
} from "@/lib/taxonomy/towns";

type Mode = "tag" | "town";

type Props = {
  mode: Mode;
  ids: string[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;

  getSeriesFor: (id: string) => { current: SeriesPoint[]; previous: SeriesPoint[] };
  getDonutFor: (id: string) => DonutDatum[];
  getDeltaPctFor: (id: string) => number;

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  onSliceClick?: (label: string) => void;

  startDate?: Date;
  endDate?: Date;

  /** para modo "tag" con drilldown forzado */
  forceDrillTownId?: TownId;
  fixedCategoryId?: CategoryId;
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
}: Props) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);
  const handleClose = () =>
    onClose ? onClose() : setUncontrolled(null);

  const orderedIds = useMemo(() => {
    const set = new Set(ids);
    const base = mode === "tag" ? CATEGORY_ID_ORDER : TOWN_ID_ORDER;
    return (base as readonly string[]).filter((id) => set.has(id));
  }, [ids, mode]);

  const isTown = mode === "town";
  const now = new Date();

  return (
    <div
      className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
    >
      {orderedIds.map((id) => {
        const title =
          mode === "tag"
            ? CATEGORY_META[id as CategoryId]?.label ?? id
            : TOWN_META[id as TownId]?.label ?? id;

        const iconSrc =
          mode === "tag"
            ? CATEGORY_META[id as CategoryId]?.iconSrc
            : TOWN_META[id as TownId]?.iconSrc;

        const imgSrc = iconSrc && iconSrc.length > 0 ? iconSrc : undefined;
        const variant = imgSrc
          ? { imgSrc }
          : {
              Icon:
                MapPinIcon as React.ComponentType<
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
              className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-2"
            >
              <SectorExpandedCardDetailed
                title={title}
                deltaPct={deltaPct}
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
                /** ⬇️ ⬇️ CLAVE PARA QUE APAREZCA EL DRILLDOWN EN TOWN */
                townId={isTown ? (id as TownId) : undefined}
                onSliceClick={onSliceClick}
                /** props para modo "tag" con drilldown forzado */
                forceDrillTownId={forceDrillTownId}
                fixedCategoryId={fixedCategoryId}
                {...variant}
              />
            </div>
          );
        }

        return (
          <div key={id} className="row-span-1">
            <SectorDeltaCard
              title={title}
              deltaPct={deltaPct}
              height={ROW_H}
              ringSize={96}
              ringThickness={8}
              expanded={false}
              onClick={() => handleOpen(id)}
              className="h-full"
              isTown={isTown}
              {...variant}
            />
          </div>
        );
      })}
    </div>
  );
}
