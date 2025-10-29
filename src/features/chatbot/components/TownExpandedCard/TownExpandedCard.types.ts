import type { FetchLevel1Response } from "@/lib/services/chatbot/level1";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";

export type TownExpandedCardProps = {
  townId: string;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onSelectCategory?: (categoryId: CategoryId) => void;
  onScrollToLevel1?: () => void;
};

export type TownHeaderProps = {
  title: string;
  subtitle: string;
  imgSrc?: string;
  onClose: () => void;
  onBack?: () => void;
};

export type TownDataResult = {
  donutData: Array<{ label: string; value: number; color?: string }>;
  lineSeriesData: Array<{ label: string; value: number }>;
  lineSeriesPrev: Array<{ label: string; value: number }>;
  totalInteractions: number;
};

export type UseTownDataParams = {
  level1Data: FetchLevel1Response | null;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
};
