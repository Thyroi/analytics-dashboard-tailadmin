"use client";

import { useHeaderAnalyticsTimeframe } from "@/features/analytics/context/HeaderAnalyticsTimeContext";
import { addDaysUTC, toISO } from "@/lib/utils/time/datetime";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getTopPagesTable,
  type GetTopPagesTableParams,
} from "../services/getTopPagesTable";

export type UseTopPagesTableParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "visits" | "deltaPct" | "label";
  sortDir?: "asc" | "desc";
  enabled?: boolean;
};

/**
 * Hook para tabla de Top Pages (UTC)
 * 
 * ⚠️ MIGRADO A UTC - Usa addDaysUTC y toISO en lugar de .setDate()
 */
export function useTopPagesTable(params: UseTopPagesTableParams = {}) {
  const { startDate, endDate, granularity, mode } =
    useHeaderAnalyticsTimeframe();

  const {
    page = 1,
    pageSize = 15,
    search = "",
    sortBy = "visits",
    sortDir = "desc",
    enabled = true,
  } = params;

  // Convert dates to ISO strings with comprehensive error handling (UTC)
  const start = useMemo(() => {
    try {
      if (
        !startDate ||
        !(startDate instanceof Date) ||
        isNaN(startDate.getTime())
      ) {
        return "";
      }

      // CRITICAL: Apply date calculations only for preset granularities, not custom ranges
      let adjustedStartDate = startDate;

      if (mode === "granularity") {
        // For preset granularities: the context already gives us the correct range
        // We just need to ensure complete data by subtracting 1 day (UTC)
        adjustedStartDate = addDaysUTC(startDate, -1);
      } else {
        // For custom ranges: use the dates as-is (user's exact selection)
        // No modification needed for custom ranges
      }

      const isoString = toISO(adjustedStartDate);
      if (!isoString || typeof isoString !== "string") {
        console.warn(
          "[useTopPagesTable] Failed to convert startDate to ISO string"
        );
        return "";
      }
      return isoString;
    } catch (error) {
      console.error("[useTopPagesTable] Error processing startDate:", error);
      return "";
    }
  }, [startDate, mode]);

  const end = useMemo(() => {
    try {
      if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.warn("[useTopPagesTable] Invalid endDate:", endDate);
        return "";
      }

      // CRITICAL: Apply date calculations only for preset granularities, not custom ranges
      let adjustedEndDate = endDate;

      if (mode === "granularity") {
        // For preset granularities: always subtract 1 day to ensure complete data (UTC)
        adjustedEndDate = addDaysUTC(endDate, -1);
      } else {
        // For custom ranges: use the dates as-is (user's exact selection)
        // No modification needed for custom ranges
      }

      const isoString = toISO(adjustedEndDate);
      if (!isoString || typeof isoString !== "string") {
        console.warn(
          "[useTopPagesTable] Failed to convert endDate to ISO string"
        );
        return "";
      }
      return isoString;
    } catch (error) {
      console.error("[useTopPagesTable] Error processing endDate:", error);
      return "";
    }
  }, [endDate, mode]);

  // Validate granularity
  const validGranularity = useMemo(() => {
    const validValues = ["d", "w", "m", "y"] as const;
    if (!granularity || !validValues.includes(granularity)) {
      console.warn("[useTopPagesTable] Invalid granularity:", granularity);
      return "d"; // Safe fallback
    }
    return granularity;
  }, [granularity]);

  const queryParams: GetTopPagesTableParams = useMemo(() => {
    try {
      return {
        start,
        end,
        granularity: validGranularity,
        page: Math.max(1, Number(page) || 1),
        pageSize: Math.max(1, Math.min(100, Number(pageSize) || 15)), // Clamp between 1-100
        search: String(search || ""),
        sortBy: ["visits", "deltaPct", "label"].includes(sortBy)
          ? sortBy
          : "visits",
        sortDir: ["asc", "desc"].includes(sortDir) ? sortDir : "desc",
      };
    } catch (error) {
      console.error("[useTopPagesTable] Error creating queryParams:", error);
      // Return safe defaults
      return {
        start: "",
        end: "",
        granularity: "d",
        page: 1,
        pageSize: 15,
        search: "",
        sortBy: "visits",
        sortDir: "desc",
      };
    }
  }, [start, end, validGranularity, page, pageSize, search, sortBy, sortDir]);

  const queryKey = useMemo(
    () => ["analytics", "top-pages-table", queryParams],
    [queryParams]
  );

  // CRITICAL DEBUG: Log everything about timeframe and granularity

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await getTopPagesTable(queryParams);
      } catch (error) {
        // CRITICAL: Log error but re-throw for React Query error handling
        console.error("[useTopPagesTable] Query function error:", {
          error: error instanceof Error ? error.message : String(error),
          queryParams,
        });
        throw error; // React Query needs the error to be thrown
      }
    },
    enabled: enabled && !!start && !!end && start !== "" && end !== "",
    staleTime: 60_000, // 1 minute - Table data can be cached longer
    retry: (failureCount, error) => {
      // Custom retry logic - be more conservative with GA API
      console.warn(
        "[useTopPagesTable] Query failed, attempt:",
        failureCount + 1,
        error
      );
      return failureCount < 2; // Maximum 3 total attempts
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
    refetchOnWindowFocus: false,
  });
}
