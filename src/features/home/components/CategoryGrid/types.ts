import type { CategoryId } from "@/lib/taxonomy/categories";

export interface CategoryGridData {
  categoryId: CategoryId;
  ga4Value: number;
  chatbotValue: number;
  combinedValue: number;
  deltaPercentage?: number | null;
}

export interface CategoryGridProps {
  data: CategoryGridData[];
  onCategoryClick: (categoryId: CategoryId) => void;
  isLoading: boolean;
}

export interface CategoryCardProps {
  data: CategoryGridData;
  onClick: () => void;
}
