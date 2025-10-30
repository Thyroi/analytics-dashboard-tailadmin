"use client";

import type { TownId } from "@/lib/taxonomy/towns";
import { GRID_CLASSES } from "./constants";
import { LoadingState } from "./LoadingState";
import { TownCard } from "./TownCard";
import type { TownGridProps } from "./types";

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
