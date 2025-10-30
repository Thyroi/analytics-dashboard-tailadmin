import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import type { RefObject } from "react";
import TownExpandedCard from "../../TownExpandedCard";

interface DrilldownSectionProps {
  selectedTownId: string | null;
  drilldownRef: RefObject<HTMLDivElement | null>;
  effectiveGranularity: WindowGranularity;
  startDateStr: string | null;
  endDateStr: string | null;
  onClose: () => void;
  onSelectCategory: (categoryId: CategoryId) => void;
  onScrollToLevel1: () => void;
}

export function DrilldownSection({
  selectedTownId,
  drilldownRef,
  effectiveGranularity,
  startDateStr,
  endDateStr,
  onClose,
  onSelectCategory,
  onScrollToLevel1,
}: DrilldownSectionProps) {
  if (!selectedTownId) return null;

  return (
    <div ref={drilldownRef} className="px-4 mb-6">
      <TownExpandedCard
        key={selectedTownId} // Forzar remontaje cuando cambia el pueblo
        townId={selectedTownId}
        granularity={effectiveGranularity}
        startDate={startDateStr}
        endDate={endDateStr}
        onClose={onClose}
        onSelectCategory={onSelectCategory}
        onScrollToLevel1={onScrollToLevel1}
      />
    </div>
  );
}
