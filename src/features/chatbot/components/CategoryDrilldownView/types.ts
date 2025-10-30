import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

export interface CategoryDrilldownViewProps {
  categoryId: CategoryId;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack?: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
}

export interface InsightCardProps {
  title: string;
  value: string;
}
