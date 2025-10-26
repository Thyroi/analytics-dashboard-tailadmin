"use client";

import DeltaCard from "@/components/common/DeltaCard";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import {
  orderIdsByTaxonomy,
  sectorIconSrc,
  sectorTitle,
} from "@/lib/utils/core/sector";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import SectorExpandedCard from "./SectorExpandedCard";

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
  getDeltaPctFor: (id: string) => number | null;
  getDeltaArtifactFor?: (id: string) => DeltaArtifact | null; // Nuevo: opcional para retrocompat

  expandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;

  startDate?: Date;
  endDate?: Date;

  /** Loader en aro + delta oculto */
  isDeltaLoading?: boolean;
};

const ROW_H = 260;

export default function SectorsGrid({
  mode,
  ids,
  granularity,
  // onGranularityChange, // No usado en la versión simplificada
  getSeriesFor,
  getDonutFor,
  getDeltaPctFor,
  getDeltaArtifactFor,
  expandedId: controlledExpandedId,
  onOpen,
  onClose,
  // startDate, // No usado en la versión simplificada
  // endDate, // No usado en la versión simplificada
  isDeltaLoading = false,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);
  const handleClose = () => (onClose ? onClose() : setUncontrolled(null));

  const orderedIds = useMemo(() => orderIdsByTaxonomy(mode, ids), [mode, ids]);
  const isTown = mode === "town";

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
        const deltaArtifact = getDeltaArtifactFor?.(id) ?? null;

        if (expandedId === id) {
          const s = getSeriesFor(id);
          const donutData = getDonutFor(id);
          return (
            <div
              key={`expanded-${id}`}
              className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-2"
            >
              <SectorExpandedCard
                title={title}
                deltaPct={deltaPct ?? 0}
                current={s.current}
                previous={s.previous}
                donutData={donutData}
                onClose={handleClose}
                isTown={isTown}
                granularity={granularity}
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
              deltaArtifact={deltaArtifact ?? undefined}
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
