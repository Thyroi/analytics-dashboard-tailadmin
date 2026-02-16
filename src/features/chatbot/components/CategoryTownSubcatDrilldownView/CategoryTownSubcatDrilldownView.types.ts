import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";

export interface CategoryTownSubcatDrilldownViewProps {
  categoryId: CategoryId;
  townId: TownId | "otros";
  categoryRaw?: string | null;
  townRaw?: string | null;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
}

export interface CategoryTownSubcatHeaderProps {
  categoryLabel: string;
  townLabel: string;
  totalInteractions?: number;
  onBack: () => void;
}

export interface SubcategoryInsight {
  label: string;
  value: number;
  delta: number | null;
}

export interface CategoryTownSubcatDataResult {
  donutData: DonutDatum[];
  totalInteractions: number;
  insights: SubcategoryInsight[];
  groupedCategories: string[];
  groupedSeries: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

export interface UseCategoryTownSubcatDataParams {
  data:
    | {
        subcategories?: Array<{
          subcategoryName: string;
          currentTotal: number;
          deltaPercent: number | null;
        }>;
        meta?: {
          range?: {
            current?: {
              start?: string;
              end?: string;
            };
          };
        };
        raw?: {
          current?: Record<string, Array<{ time: string; value: number }>>;
        };
      }
    | null
    | undefined;
  categoryId: CategoryId;
  townId: TownId | "otros";
  townRaw?: string | null;
  granularity: WindowGranularity;
}
