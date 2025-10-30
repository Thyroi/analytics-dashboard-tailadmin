"use client";

import type { TownId } from "@/lib/taxonomy/towns";
import type { TownGridProps } from "./types";
import { GRID_CLASSES } from "./constants";
import { TownCard } from "./TownCard";
import { LoadingState } from "./LoadingState";

export function TownGrid({ data, onTownClick, isLoading }: TownGridProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={GRID_CLASSES}>
      {data.map((townData) => (
        <TownCard
          key={townData.id}
          data={townData}
          onClick={() => onTownClick(townData.id as TownId)}
        />
      ))}
    </div>
  );
}
