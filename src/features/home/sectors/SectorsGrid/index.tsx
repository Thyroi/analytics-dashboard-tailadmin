"use client";

import { orderIdsByTaxonomy } from "@/lib/utils/core/sector";
import { useMemo } from "react";
import { CollapsedSectorCard } from "./CollapsedSectorCard";
import { GRID_CLASSES, ROW_HEIGHT } from "./constants";
import { ExpandedSectorCard } from "./ExpandedSectorCard";
import type { SectorsGridProps } from "./types";
import { useExpandedState } from "./useExpandedState";
import { getSectorVariant } from "./useSectorVariant";

export default function SectorsGrid({
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
  isDeltaLoading = false,
}: SectorsGridProps) {
  const { expandedId, handleOpen, handleClose } = useExpandedState({
    controlledExpandedId,
    onOpen,
    onClose,
  });

  const orderedIds = useMemo(() => orderIdsByTaxonomy(mode, ids), [mode, ids]);
  const isTown = mode === "town";

  return (
    <div
      className={GRID_CLASSES}
      style={{ gridAutoRows: `minmax(${ROW_HEIGHT}px, auto)` }}
    >
      {orderedIds.map((id) => {
        const { title, variant } = getSectorVariant(mode, id);
        const deltaPct = getDeltaPctFor(id);
        const deltaArtifact = getDeltaArtifactFor?.(id) ?? null;

        if (expandedId === id) {
          return (
            <ExpandedSectorCard
              key={`expanded-${id}`}
              id={id}
              title={title}
              deltaPct={deltaPct}
              getSeriesFor={getSeriesFor}
              getDonutFor={getDonutFor}
              onClose={handleClose}
              isTown={isTown}
              granularity={granularity}
              variant={variant}
            />
          );
        }

        return (
          <CollapsedSectorCard
            key={id}
            id={id}
            title={title}
            deltaPct={deltaPct}
            deltaArtifact={deltaArtifact}
            onOpen={handleOpen}
            isTown={isTown}
            isDeltaLoading={isDeltaLoading}
            variant={variant}
          />
        );
      })}
    </div>
  );
}
