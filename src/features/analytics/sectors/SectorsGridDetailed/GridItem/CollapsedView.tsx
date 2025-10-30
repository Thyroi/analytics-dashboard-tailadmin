import DeltaCard from "@/components/common/DeltaCard";
import type { IconOrImage } from "@/lib/utils/core/images";
import {
  COLLAPSED_GRID_CLASSES,
  RING_SIZE,
  RING_THICKNESS,
  ROW_HEIGHT,
} from "./constants";

interface CollapsedViewProps {
  id: string;
  title: string;
  deltaPct: number | null;
  isTown: boolean;
  isDeltaLoading: boolean;
  handleOpen: (id: string) => void;
  collapsedVariant: IconOrImage;
}

export function CollapsedView({
  id,
  title,
  deltaPct,
  isTown,
  isDeltaLoading,
  handleOpen,
  collapsedVariant,
}: CollapsedViewProps) {
  return (
    <div key={id} className={COLLAPSED_GRID_CLASSES}>
      <DeltaCard
        title={title}
        deltaPct={deltaPct}
        height={ROW_HEIGHT}
        ringSize={RING_SIZE}
        ringThickness={RING_THICKNESS}
        expanded={false}
        onClick={() => handleOpen(id)}
        className="h-full"
        isTown={isTown}
        loading={isDeltaLoading}
        {...collapsedVariant}
      />
    </div>
  );
}
