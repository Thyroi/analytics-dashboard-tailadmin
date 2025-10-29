import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";

export interface TownCategorySubcatDrilldownViewProps {
  townId: TownId;
  categoryId: CategoryId;
  townRaw?: string | null;
  categoryRaw?: string | null;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity: WindowGranularity;
  onBack: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
}

export interface TownCategorySubcatHeaderProps {
  townLabel: string;
  categoryLabel: string;
  totalInteractions?: number;
  onBack: () => void;
}

export interface SubcategoryInsight {
  label: string;
  value: number;
  delta: number | null;
}

export interface TownCategorySubcatDataResult {
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

export interface UseTownCategorySubcatDataParams {
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
  categoryRaw?: string | null;
  windowGranularity: WindowGranularity;
}
