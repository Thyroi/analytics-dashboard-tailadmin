import DeltaCard from "@/components/common/DeltaCard";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { ROW_HEIGHT, RING_SIZE, RING_THICKNESS, COLLAPSED_CARD_SPAN } from "./constants";

interface CollapsedSectorCardProps {
  id: string;
  title: string;
  deltaPct: number | null;
  deltaArtifact: DeltaArtifact | null;
  onOpen: (id: string) => void;
  isTown: boolean;
  isDeltaLoading: boolean;
  variant: { imgSrc: string } | { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> };
}

export function CollapsedSectorCard({
  id,
  title,
  deltaPct,
  deltaArtifact,
  onOpen,
  isTown,
  isDeltaLoading,
  variant,
}: CollapsedSectorCardProps) {
  return (
    <div className={COLLAPSED_CARD_SPAN}>
      <DeltaCard
        title={title}
        deltaPct={deltaPct}
        deltaArtifact={deltaArtifact ?? undefined}
        height={ROW_HEIGHT}
        ringSize={RING_SIZE}
        ringThickness={RING_THICKNESS}
        expanded={false}
        onClick={() => onOpen(id)}
        className="h-full"
        isTown={isTown}
        loading={isDeltaLoading}
        {...variant}
      />
    </div>
  );
}
