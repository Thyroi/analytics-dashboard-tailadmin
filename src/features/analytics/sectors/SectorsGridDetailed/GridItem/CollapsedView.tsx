import DeltaCard from "@/components/common/DeltaCard";
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
  imgSrc?: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function CollapsedView({
  id,
  title,
  deltaPct,
  isTown,
  isDeltaLoading,
  handleOpen,
  imgSrc,
  Icon,
}: CollapsedViewProps) {
  // Construir props específicas para DeltaCard
  const mediaProps = imgSrc ? { imgSrc } : { Icon: Icon! };

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
        {...mediaProps}
      />
    </div>
  );
}
