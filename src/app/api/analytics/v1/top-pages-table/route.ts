import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export type TopPagesTableResponse = {
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    granularity: "d" | "w" | "m" | "y";
    start: string;
    end: string;
    shiftedPrev: { start: string; end: string };
  };
  data: Array<{
    path: string;
    label: string;
    visits: number;
    prevVisits: number | null;
    deltaPct: number | null;
  }>;
};

function calculateShiftedPeriod(
  start: string,
  end: string,
  granularity: "d" | "w" | "m" | "y"
): { start: string; end: string } {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const shiftedStart = new Date(startDate);
  const shiftedEnd = new Date(endDate);

  switch (granularity) {
    case "d":
    case "w":
      // Shift -1 día
      shiftedStart.setDate(shiftedStart.getDate() - 1);
      shiftedEnd.setDate(shiftedEnd.getDate() - 1);
      break;
    case "m":
      // Shift -1 día (manteniendo buckets diarios dentro del mes)
      shiftedStart.setDate(shiftedStart.getDate() - 1);
      shiftedEnd.setDate(shiftedEnd.getDate() - 1);
      break;
    case "y":
      // Shift -1 mes
      shiftedStart.setMonth(shiftedStart.getMonth() - 1);
      shiftedEnd.setMonth(shiftedEnd.getMonth() - 1);
      break;
  }

  return {
    start: shiftedStart.toISOString().split("T")[0],
    end: shiftedEnd.toISOString().split("T")[0],
  };
}

function calculateDeltaPct(
  current: number,
  prev: number | null
): number | null {
  if (prev === null || prev <= 0) return null;
  return (current - prev) / prev;
}

function extractLabel(path: string): string {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "/";
  return decodeURIComponent(lastSegment);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // CRITICAL DEBUG: Log all incoming parameters

    const start = searchParams.get("start") ?? "";
    const end = searchParams.get("end") ?? "";
    const granularity = searchParams.get("granularity") as
      | "d"
      | "w"
      | "m"
      | "y";
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "15");
    const search = searchParams.get("search") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "visits";
    const sortDir = searchParams.get("sortDir") ?? "desc";

    // CRITICAL DEBUG: Log processed parameters

    // Calculate date range and its effect
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const daysDifference = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!start || !end || !granularity) {
      return NextResponse.json(
        { error: "Missing required parameters: start, end, granularity" },
        { status: 400 }
      );
    }

    const shiftedPrev = calculateShiftedPeriod(start, end, granularity);

    // Setup GA4 client
    const auth = getAuth();
    const ga = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // CRITICAL DEBUG: Log GA4 query parameters
    const gaQueryParams = {
      property,
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [
        {
          metric: { metricName: "screenPageViews" },
          desc: true,
        },
      ],
      limit: "10000",
    };

    // Get current period data - INCREASED LIMIT TO CAPTURE ALL PAGES
    const currentResponse = await ga.properties.runReport({
      property,
      requestBody: gaQueryParams,
    });

    // CRITICAL DEBUG: Log GA4 response

    // Get previous period data
    const prevResponse = await ga.properties.runReport({
      property,
      requestBody: {
        dateRanges: [
          { startDate: shiftedPrev.start, endDate: shiftedPrev.end },
        ],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        limit: "10000", // Same increased limit
      },
    });

    // Process current data
    const currentData = new Map<string, number>();
    currentResponse.data.rows?.forEach(
      (row: analyticsdata_v1beta.Schema$Row) => {
        const path = row.dimensionValues?.[0]?.value ?? "";
        const visits = parseInt(row.metricValues?.[0]?.value ?? "0");
        currentData.set(path, visits);
      }
    );

    // Process previous data
    const prevData = new Map<string, number>();
    prevResponse.data.rows?.forEach((row: analyticsdata_v1beta.Schema$Row) => {
      const path = row.dimensionValues?.[0]?.value ?? "";
      const visits = parseInt(row.metricValues?.[0]?.value ?? "0");
      prevData.set(path, visits);
    });

    // Combine and process ALL items
    let allItems = Array.from(currentData.entries()).map(([path, visits]) => {
      const label = extractLabel(path);
      const prevVisits = prevData.get(path) ?? null;
      const deltaPct = calculateDeltaPct(visits, prevVisits);

      return {
        path,
        label,
        visits,
        prevVisits,
        deltaPct,
      };
    });

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allItems = allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchLower) ||
          item.path.toLowerCase().includes(searchLower)
      );
    }

    // Sort items
    allItems.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "visits":
          comparison = a.visits - b.visits;
          break;
        case "deltaPct":
          const aDelta = a.deltaPct ?? -Infinity;
          const bDelta = b.deltaPct ?? -Infinity;
          comparison = aDelta - bDelta;
          break;
        case "label":
          comparison = a.label.localeCompare(b.label);
          break;
        default:
          comparison = a.visits - b.visits;
      }

      return sortDir === "desc" ? -comparison : comparison;
    });

    // Pagination on the COMPLETE dataset
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

    // CRITICAL DEBUG: Final response analysis

    const response: TopPagesTableResponse = {
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        granularity,
        start,
        end,
        shiftedPrev,
      },
      data: paginatedItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[TableAPI] Error in top-pages-table API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
