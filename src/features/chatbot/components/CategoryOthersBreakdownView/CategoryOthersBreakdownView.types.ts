import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import type { OthersBreakdownEntry } from "@/lib/services/chatbot/categoryTownBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, WindowGranularity } from "@/lib/types";

export interface CategoryOthersBreakdownViewProps {
  categoryId: CategoryId;
  othersBreakdown: OthersBreakdownEntry[];
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack?: () => void;
}

export interface CategoryOthersHeaderProps {
  categoryLabel: string;
  totalInteractions?: number;
  onBack?: () => void;
}

export interface CategoryOthersDataResult {
  donutData: DonutDatum[];
  totalInteractions: number;
  categories: string[];
  groupedSeries: GroupedBarSeries[];
}

export interface UseCategoryOthersDataParams {
  othersBreakdown: OthersBreakdownEntry[];
  granularity: WindowGranularity;
}
