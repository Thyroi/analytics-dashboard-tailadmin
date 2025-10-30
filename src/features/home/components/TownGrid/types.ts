import type { TownGridData } from "@/features/home/hooks/useResumenTown";
import type { TownId } from "@/lib/taxonomy/towns";

export interface TownCardProps {
  data: TownGridData;
  onClick: () => void;
}

export interface TownGridProps {
  data: TownGridData[];
  onTownClick: (townId: TownId) => void;
  isLoading?: boolean;
}
