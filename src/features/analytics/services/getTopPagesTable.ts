import type { TopPagesTableResponse } from "@/app/api/analytics/v1/top-pages-table/route";
import { fetchJSON } from "@/lib/api/analytics";

export type GetTopPagesTableParams = {
  start: string;
  end: string;
  granularity: "d" | "w" | "m" | "y";
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "visits" | "deltaPct" | "label";
  sortDir?: "asc" | "desc";
};

export async function getTopPagesTable(
  params: GetTopPagesTableParams
): Promise<TopPagesTableResponse> {
  try {
    // Input validation with error barriers
    if (!params || typeof params !== "object") {
      throw new Error("Invalid params object provided to getTopPagesTable");
    }

    const { start, end, granularity } = params;

    // Critical validation - prevent empty or invalid required params
    if (!start || typeof start !== "string" || start.trim() === "") {
      throw new Error("Invalid or missing start date parameter");
    }

    if (!end || typeof end !== "string" || end.trim() === "") {
      throw new Error("Invalid or missing end date parameter");
    }

    if (!granularity || !["d", "w", "m", "y"].includes(granularity)) {
      throw new Error(`Invalid granularity parameter: ${granularity}`);
    }

    const queryParams = new URLSearchParams();

    // Set required parameters with validation
    queryParams.set("start", start.trim());
    queryParams.set("end", end.trim());
    queryParams.set("granularity", granularity);

    // Set optional parameters with validation
    if (
      params.page !== undefined &&
      Number.isInteger(params.page) &&
      params.page > 0
    ) {
      queryParams.set("page", params.page.toString());
    }

    if (
      params.pageSize !== undefined &&
      Number.isInteger(params.pageSize) &&
      params.pageSize > 0 &&
      params.pageSize <= 100
    ) {
      queryParams.set("pageSize", params.pageSize.toString());
    }

    if (
      params.search &&
      typeof params.search === "string" &&
      params.search.trim() !== ""
    ) {
      queryParams.set("search", params.search.trim());
    }

    if (
      params.sortBy &&
      ["visits", "deltaPct", "label"].includes(params.sortBy)
    ) {
      queryParams.set("sortBy", params.sortBy);
    }

    if (params.sortDir && ["asc", "desc"].includes(params.sortDir)) {
      queryParams.set("sortDir", params.sortDir);
    }

    const url = `/api/analytics/v1/top-pages-table?${queryParams.toString()}`;

    const response = await fetchJSON<TopPagesTableResponse>(url);

    // Validate response structure
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response structure from table API");
    }

    if (!response.data || !Array.isArray(response.data)) {
      console.warn(
        "[getTopPagesTable] Missing or invalid data array in response"
      );
      // Return empty structure instead of failing
      return {
        data: [],
        meta: {
          page: params.page || 1,
          pageSize: params.pageSize || 15,
          totalItems: 0,
          totalPages: 0,
          granularity: granularity,
          start,
          end,
          shiftedPrev: { start: "", end: "" },
        },
      };
    }

    return response;
  } catch (error) {
    // CRITICAL: Enhanced error logging but still re-throw
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[getTopPagesTable] Service error:", {
      error: errorMessage,
      params,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw for React Query error handling
    throw new Error(`Failed to fetch table pages data: ${errorMessage}`);
  }
}
