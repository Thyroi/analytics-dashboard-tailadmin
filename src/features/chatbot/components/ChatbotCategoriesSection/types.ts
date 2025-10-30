import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DeltaArtifact } from "@/lib/utils/delta";

export type CategoryCardData = {
  id: string;
  label: string;
  deltaPercent: number | null;
  deltaArtifact: DeltaArtifact;
  iconSrc: string;
};

export type CategoryGridProps = {
  categories: CategoryCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  onCategoryClick: (categoryId: string) => void;
  selectedCategoryId: CategoryId | null;
};

export type CategoryCardProps = {
  data: CategoryCardData;
  onCategoryClick: (categoryId: string) => void;
  isSelected: boolean;
};
