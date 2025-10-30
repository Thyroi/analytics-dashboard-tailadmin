import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

export interface CategoryDrilldownModalProps {
  categoryId: CategoryId;
  granularity: Granularity;
  onClose: () => void;
}

export interface CategoryTotals {
  ga4Total: number;
  chatbotTotal: number;
  combinedTotal: number;
}
