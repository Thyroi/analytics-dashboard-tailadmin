import type { CategoryId } from "@/lib/taxonomy/categories";

export interface CategoryDetailsParams {
  categoryId: CategoryId;
  granularity: string;
  startDate: string;
  endDate: string;
}

export interface TimeParams {
  startISO: string;
  endISO: string;
}

export interface SeriesRanges {
  current: {
    start: string;
    end: string;
  };
  previous?: {
    start: string;
    end: string;
  };
}
