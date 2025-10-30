import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DeltaArtifact } from "@/lib/utils/delta/types";

export type TownGridProps = {
  towns: TownCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefetch: () => void;
  onTownClick: (townId: string) => void;
  selectedTownId: string | null;
};

export type TownCardData = {
  id: TownId;
  label: string;
  iconSrc: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPercent: number | null;
  deltaArtifact: DeltaArtifact;
};

export type DrilldownCallbacks = {
  onClose: () => void;
  onSelectCategory: (categoryId: CategoryId) => void;
  onScrollToLevel1: () => void;
};
