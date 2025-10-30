import DeltaCard from "@/components/common/DeltaCard";
import type { CategoryCardProps } from "./types";

export function CategoryCard({
  data,
  onCategoryClick,
  isSelected,
}: CategoryCardProps) {
  return (
    <DeltaCard
      title={data.label}
      deltaPct={data.deltaPercent ?? null}
      deltaArtifact={data.deltaArtifact}
      imgSrc={data.iconSrc}
      onClick={() => onCategoryClick(data.id)}
      className={`h-full cursor-pointer transition-all ${
        isSelected
          ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg bg-blue-50 dark:bg-blue-900/20"
          : "hover:shadow-lg"
      }`}
      loading={false}
    />
  );
}
