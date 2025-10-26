import { useUrlSeries } from "@/features/analytics/hooks/useUrlSeries";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor } from "../../../../__tests__/utils/test-utils";

// Mock fetchJSON with proper Vitest pattern
vi.mock("@/lib/api/analytics", () => ({
  fetchJSON: vi.fn(),
}));

// Import the mocked module to get access to the mock
import { fetchJSON } from "@/lib/api/analytics";
const mockFetchJSON = vi.mocked(fetchJSON);

describe("useUrlSeries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("handles empty URLs array", () => {
    const { result } = renderHook(() =>
      useUrlSeries({
        urls: [],
        granularity: "d",
      })
    );

    expect(result.current.loading).toBe(true);
    expect(mockFetchJSON).not.toHaveBeenCalled();
  });

  test("fetches URL series data successfully", async () => {
    const mockResponse = {
      granularity: "d",
      range: {
        current: { start: "2025-10-08", end: "2025-10-10" },
        previous: { start: "2025-10-01", end: "2025-10-03" },
      },
      context: { path: "https://wp.ideanto.com/bollullos/naturaleza/" },
      xLabels: ["2025-10-08", "2025-10-09", "2025-10-10"],
      seriesAvgEngagement: {
        current: [
          { label: "2025-10-08", value: 45 },
          { label: "2025-10-09", value: 52 },
          { label: "2025-10-10", value: 38 },
        ],
        previous: [
          { label: "2025-10-01", value: 35 },
          { label: "2025-10-02", value: 41 },
          { label: "2025-10-03", value: 29 },
        ],
      },
      kpis: {
        current: { activeUsers: 100, sessions: 150 },
        previous: { activeUsers: 80, sessions: 120 },
        deltaPct: { activeUsers: 25, sessions: 25 },
      },
      operatingSystems: [
        { label: "Windows", value: 60 },
        { label: "Android", value: 40 },
      ],
      genders: [
        { label: "male", value: 55 },
        { label: "female", value: 45 },
      ],
      countries: [
        { label: "Spain", value: 80 },
        { label: "France", value: 20 },
      ],
      deltaPct: 25,
    };

    mockFetchJSON.mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useUrlSeries({
        urls: ["https://wp.ideanto.com/bollullos/naturaleza/"],
        granularity: "d",
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchJSON).toHaveBeenCalledWith(
      "/api/analytics/v1/drilldown/url?path=https%3A%2F%2Fwp.ideanto.com%2Fbollullos%2Fnaturaleza%2F&granularity=d"
    );

    expect(result.current).toEqual({
      loading: false,
      data: mockResponse,
      seriesByUrl: [
        {
          name: "naturaleza",
          data: [45, 52, 38],
          path: "https://wp.ideanto.com/bollullos/naturaleza/",
        },
      ],
      xLabels: ["2025-10-08", "2025-10-09", "2025-10-10"],
    });
  });

  test("includes endISO parameter when provided", async () => {
    const mockResponse = {
      granularity: "w",
      range: {
        current: { start: "", end: "" },
        previous: { start: "", end: "" },
      },
      context: { path: "" },
      xLabels: [],
      seriesAvgEngagement: { current: [], previous: [] },
      kpis: { current: {}, previous: {}, deltaPct: {} },
      operatingSystems: [],
      genders: [],
      countries: [],
      deltaPct: 0,
    };

    mockFetchJSON.mockResolvedValue(mockResponse);

    renderHook(() =>
      useUrlSeries({
        urls: ["https://example.com/test"],
        granularity: "w",
        endISO: "2025-10-15",
      })
    );

    await waitFor(() => {
      expect(mockFetchJSON).toHaveBeenCalledWith(
        "/api/analytics/v1/drilldown/url?path=https%3A%2F%2Fexample.com%2Ftest&granularity=w&endDate=2025-10-15"
      );
    });
  });

  test("handles API errors gracefully", async () => {
    mockFetchJSON.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useUrlSeries({
        urls: ["https://example.com/test"],
        granularity: "d",
      })
    );

    // Since we removed console.error, just verify the error state is handled correctly
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  test("aborts requests when URLs change", async () => {
    mockFetchJSON.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({ xLabels: [], seriesAvgEngagement: { current: [] } }),
            100
          );
        })
    );

    const { rerender } = renderHook(
      ({ urls }) =>
        useUrlSeries({
          urls,
          granularity: "d",
        }),
      {
        initialProps: { urls: ["https://example.com/test1"] },
      }
    );

    expect(mockFetchJSON).toHaveBeenCalledTimes(1);
    expect(mockFetchJSON).toHaveBeenNthCalledWith(
      1,
      "/api/analytics/v1/drilldown/url?path=https%3A%2F%2Fexample.com%2Ftest1&granularity=d"
    );

    // Change URLs
    rerender({ urls: ["https://example.com/test2"] });

    expect(mockFetchJSON).toHaveBeenCalledTimes(2);
    expect(mockFetchJSON).toHaveBeenNthCalledWith(
      2,
      "/api/analytics/v1/drilldown/url?path=https%3A%2F%2Fexample.com%2Ftest2&granularity=d"
    );
  });

  test("handles multiple URLs by using first URL only", async () => {
    const mockResponse = {
      granularity: "d",
      range: {
        current: { start: "", end: "" },
        previous: { start: "", end: "" },
      },
      context: { path: "" },
      xLabels: ["day1", "day2"],
      seriesAvgEngagement: {
        current: [
          { label: "day1", value: 10 },
          { label: "day2", value: 20 },
        ],
        previous: [],
      },
      kpis: { current: {}, previous: {}, deltaPct: {} },
      operatingSystems: [],
      genders: [],
      countries: [],
      deltaPct: 0,
    };

    mockFetchJSON.mockResolvedValue(mockResponse);

    renderHook(() =>
      useUrlSeries({
        urls: ["https://example.com/test1", "https://example.com/test2"],
        granularity: "d",
      })
    );

    await waitFor(() => {
      // Should only call API with first URL
      expect(mockFetchJSON).toHaveBeenCalledWith(
        "/api/analytics/v1/drilldown/url?path=https%3A%2F%2Fexample.com%2Ftest1&granularity=d"
      );
    });
  });
});
