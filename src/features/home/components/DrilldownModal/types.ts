import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

export interface DrilldownModalProps {
  townId: TownId;
  granularity: Granularity;
  onClose: () => void;
}
