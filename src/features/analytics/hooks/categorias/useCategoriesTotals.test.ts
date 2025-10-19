import { useCategoriesTotalsNew } from "@/features/analytics/hooks/categorias/useCategoriesTotals";
import * as totalsService from "@/lib/services/categorias/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the service
vi.mock("@/lib/services/categorias/totals");

const mockFetchCategoriesTotals = vi.mocked(
  totalsService.fetchCategoriesTotals
);

// Helper to create a query client for each test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
}

describe("useCategoriesTotalsNew", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch data with default parameters", async () => {
    const mockResponse = {
      granularity: "d" as const,
      range: {
        current: { start: "2024-10-10", end: "2024-10-11" },
        previous: { start: "2024-10-09", end: "2024-10-10" },
      },
      property: "test-property",
      items: [
        {
          id: "naturaleza" as CategoryId,
          title: "Naturaleza",
          total: 100,
          previousTotal: 87, // Agregado para compatibilidad
          deltaPct: 15.5,
        },
        {
          id: "playas" as CategoryId,
          title: "Playas",
          total: 75,
          previousTotal: 83, // Agregado para compatibilidad
          deltaPct: -10.2,
        },
      ],
    };

    mockFetchCategoriesTotals.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategoriesTotalsNew(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(mockFetchCategoriesTotals).toHaveBeenCalledWith({
      granularity: "d",
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("should pass custom options to the service", async () => {
    const mockResponse = {
      granularity: "w" as const,
      range: {
        current: { start: "2024-10-01", end: "2024-10-07" },
        previous: { start: "2024-09-24", end: "2024-09-30" },
      },
      property: "test-property",
      items: [],
    };

    mockFetchCategoriesTotals.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useCategoriesTotalsNew({
          granularity: "w",
          startDate: "2024-10-01",
          endDate: "2024-10-07",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetchCategoriesTotals).toHaveBeenCalledWith({
      granularity: "w",
      startDate: "2024-10-01",
      endDate: "2024-10-07",
    });
  });

  it("should handle disabled state", () => {
    const { result } = renderHook(
      () => useCategoriesTotalsNew({ enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetchCategoriesTotals).not.toHaveBeenCalled();
  });

  it("should handle empty data response", async () => {
    const mockResponse = {
      granularity: "d" as const,
      range: {
        current: { start: "2024-10-10", end: "2024-10-11" },
        previous: { start: "2024-10-09", end: "2024-10-10" },
      },
      property: "test-property",
      items: [],
    };

    mockFetchCategoriesTotals.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCategoriesTotalsNew(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(0);
  });

  it.each(["d", "w", "m", "y"] as const)(
    "should handle %s granularity",
    async (granularity) => {
      const mockResponse = {
        granularity,
        range: {
          current: { start: "2024-10-01", end: "2024-10-07" },
          previous: { start: "2024-09-24", end: "2024-09-30" },
        },
        property: "test-property",
        items: [],
      };

      mockFetchCategoriesTotals.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useCategoriesTotalsNew({ granularity }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetchCategoriesTotals).toHaveBeenCalledWith({
        granularity,
        startDate: undefined,
        endDate: undefined,
      });
    }
  );
});
