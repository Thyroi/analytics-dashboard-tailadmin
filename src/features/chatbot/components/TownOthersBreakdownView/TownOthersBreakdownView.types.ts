import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import type { OthersBreakdownEntry } from "@/lib/services/chatbot/townCategoryBreakdown";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";

export interface TownOthersBreakdownViewProps {
  townId: TownId;
  othersBreakdown: OthersBreakdownEntry[];
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack?: () => void;
}

export interface TownOthersHeaderProps {
  townLabel: string;
  totalInteractions?: number;
  onBack?: () => void;
}

export interface TownOthersDataResult {
  donutData: DonutDatum[];
  totalInteractions: number;
  categories: string[];
  groupedSeries: GroupedBarSeries[];
}

export interface UseTownOthersDataParams {
  othersBreakdown: OthersBreakdownEntry[];
  granularity: WindowGranularity;
}
