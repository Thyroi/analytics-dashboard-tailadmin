/**
 * Servicio para interactuar con el endpoint debug de fechas
 */

import type { Granularity } from "@/lib/types";

export type DebugFechasParams = {
  start: string;
  end: string;
  granularity?: Granularity;
};

export type DebugFechasResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: Array<{
    id: string;
    title: string;
    total: number;
    previousTotal: number;
    deltaPct: number | null;
  }>;
  debug: {
    params: {
      receivedParams: {
        start: string | null;
        end: string | null;
        granularity: string | null;
      };
      timestamp: string;
    };
    calculation: {
      originalGranularity: Granularity;
      finalGranularity: Granularity;
      durationDays: number;
      ranges: {
        current: { start: string; end: string };
        previous: { start: string; end: string };
      };
      granularityReason: string;
    };
    ga4Request: {
      property: string;
      requestBody: Record<string, unknown>;
    };
    ga4Response: {
      totalRows: number;
      sampleResponse: Record<string, unknown>[];
      processedCategories: number;
    };
    summary: {
      totalCurrentEvents: number;
      totalPreviousEvents: number;
      categoriesWithData: number;
    };
  };
};

export class DebugFechasService {
  private baseUrl = "/api/debug/fechas";

  async fetchDebugData(
    params: DebugFechasParams
  ): Promise<DebugFechasResponse> {
    const url = new URL(this.baseUrl, window.location.origin);

    url.searchParams.set("start", params.start);
    url.searchParams.set("end", params.end);

    if (params.granularity) {
      url.searchParams.set("granularity", params.granularity);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  async testRangeCalculation(
    start: string,
    end: string,
    granularityOverride?: Granularity
  ): Promise<DebugFechasResponse> {
    return this.fetchDebugData({
      start,
      end,
      granularity: granularityOverride,
    });
  }
}
