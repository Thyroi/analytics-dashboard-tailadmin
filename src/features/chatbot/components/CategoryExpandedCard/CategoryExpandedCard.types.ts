import type { FetchLevel1Response } from "@/lib/services/chatbot/level1";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";

export type CategoryDrilldownTownId = TownId | "otros";

export type CategoryExpandedCardProps = {
  categoryId: CategoryId;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onTownClick?: (townId: CategoryDrilldownTownId) => void;
  onScrollToLevel1?: () => void;
};

export type CategoryHeaderProps = {
  title: string;
  subtitle: string;
  imgSrc?: string;
  onClose: () => void;
  onBack?: () => void;
};

export type CategoryDataResult = {
  donutData: Array<{ label: string; value: number; color?: string }>;
  lineSeriesData: Array<{ label: string; value: number }>;
  lineSeriesPrev: Array<{ label: string; value: number }>;
  totalInteractions: number;
};

export type UseCategoryDataParams = {
  level1Data: FetchLevel1Response | null;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
};
