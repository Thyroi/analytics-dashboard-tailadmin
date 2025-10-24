/**
 * Servicio para debug de discrepancias en details (donut vs series)
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

export type DebugAnalysis = {
  seriesTotal: number;
  seriesPoints: number;
  donutTotal: number;
  donutItems: number;
  lastSeriesPoint: number;
  deltaPct: number | null;
};

export type DebugDetailsResponse = {
  input: {
    startDate: string;
    endDate: string;
    categoryId: CategoryId;
    categoryLabel: string;
    townId: TownId;
    townLabel: string;
    requestedGranularity: Granularity;
  };
  calculation: {
    finalGranularity: Granularity;
    granularityReason: string;
    durationDays: number;
    currentRange: { start: string; end: string };
    previousRange: { start: string; end: string };
  };
  apis: {
    categoryDetails: {
      url: string;
      note: string;
    };
    townDetails: {
      url: string;
      note: string;
    };
  };
  analysis?: DebugAnalysis;
  apiErrors?: string[];
  potentialIssues: Array<{
    issue: string;
    description: string;
    investigation: string;
  }>;
  nextSteps: string[];
};

export async function fetchDebugDetails(params: {
  startDate: string;
  endDate: string;
  categoryId: CategoryId;
  townId: TownId;
  granularity: Granularity;
}): Promise<DebugDetailsResponse> {
  const url = new URL("/api/debug/details", window.location.origin);
  url.searchParams.set("startDate", params.startDate);
  url.searchParams.set("endDate", params.endDate);
  url.searchParams.set("categoryId", params.categoryId);
  url.searchParams.set("townId", params.townId);
  url.searchParams.set("granularity", params.granularity);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Debug details failed: ${response.status}`);
  }

  return response.json();
}
