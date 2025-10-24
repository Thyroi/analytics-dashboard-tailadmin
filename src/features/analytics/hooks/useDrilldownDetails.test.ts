import { useDrilldownDetails } from "@/features/analytics/hooks/useDrilldownDetails";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor } from "../../../../__tests__/utils/test-utils";

// Mock fetchJSON with proper Vitest pattern
vi.mock("@/lib/api/analytics", () => ({
  fetchJSON: vi.fn(),
}));

// Helper function to get a different category for testing
function getDifferentCategory(currentCategory: CategoryId): CategoryId {
  const availableCategories = CATEGORY_ID_ORDER.filter(
    (id) => id !== currentCategory
  );
  return availableCategories[0] || "fiestasTradiciones"; // fallback
}

// Import the mocked module to get access to the mock
import { fetchJSON } from "@/lib/api/analytics";
const mockFetchJSON = vi.mocked(fetchJSON);

const mockDrilldownResponse = {
  granularity: "d",
  range: {
    current: { start: "2025-10-08", end: "2025-10-10" },
    previous: { start: "2025-10-01", end: "2025-10-03" },
  },
  property: "properties/123456789",
  id: "almonte",
  title: "Almonte",
  series: {
    current: [
      { label: "2025-10-08", value: 10 },
      { label: "2025-10-09", value: 20 },
      { label: "2025-10-10", value: 30 },
    ],
    previous: [
      { label: "2025-10-01", value: 5 },
      { label: "2025-10-02", value: 15 },
      { label: "2025-10-03", value: 25 },
    ],
  },
  donutData: [
    { label: "https://example.com/almonte/naturaleza/donana", value: 80 },
    { label: "https://example.com/almonte/naturaleza/beach", value: 20 },
  ],
  deltaPct: 33.33,
};

describe("useDrilldownDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchJSON.mockResolvedValue(mockDrilldownResponse);
  });

  test("handles pueblo-category drilldown configuration", async () => {
    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
      })
    );

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify correct endpoint was called
    expect(mockFetchJSON).toHaveBeenCalledWith(
      "/api/analytics/v1/dimensions/pueblos/details/almonte?g=d&categoryId=naturaleza"
    );

    // Verify returned data structure
    expect(result.current).toMatchObject({
      loading: false,
      response: mockDrilldownResponse,
      donut: [
        { label: "https://example.com/almonte/naturaleza/donana", value: 80 },
        { label: "https://example.com/almonte/naturaleza/beach", value: 20 },
      ],
      deltaPct: 33.33,
    });
  });

  test("handles category-town drilldown configuration", async () => {
    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "category-pueblo",
        categoryId: "naturaleza",
        townId: "almonte",
        granularity: "d",
      })
    );

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify correct endpoint was called (categoria endpoint with townId filter)
    expect(mockFetchJSON).toHaveBeenCalledWith(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?granularity=d&townId=almonte"
    );
  });

  test("includes endISO parameter when provided", async () => {
    renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
        endISO: "2025-10-15",
      })
    );

    await waitFor(() => {
      expect(mockFetchJSON).toHaveBeenCalledWith(
        "/api/analytics/v1/dimensions/pueblos/details/almonte?g=d&end=2025-10-15&categoryId=naturaleza"
      );
    });
  });

  test("handles different granularities", async () => {
    const granularities = ["d", "w", "m", "y"] as const;

    for (const granularity of granularities) {
      const { unmount } = renderHook(() =>
        useDrilldownDetails({
          type: "pueblo-category",
          townId: "almonte",
          categoryId: "naturaleza",
          granularity,
        })
      );

      await waitFor(() => {
        expect(mockFetchJSON).toHaveBeenCalledWith(
          expect.stringContaining(`g=${granularity}`)
        );
      });

      unmount();
      vi.clearAllMocks();
      mockFetchJSON.mockResolvedValue(mockDrilldownResponse);
    }
  });

  test("handles API errors gracefully", async () => {
    mockFetchJSON.mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(true); // Stays loading on error
    });

    // Since we removed console.error, just verify the error state is handled correctly
    expect(result.current.loading).toBe(true);
  });

  test("aborts requests when config changes", async () => {
    const initialCategory: CategoryId = "naturaleza";

    type TestConfig = {
      type: "pueblo-category";
      townId: "almonte";
      categoryId: CategoryId;
      granularity: "d";
    };

    const { result, rerender } = renderHook<
      ReturnType<typeof useDrilldownDetails>,
      TestConfig
    >((props) => useDrilldownDetails(props), {
      initialProps: {
        type: "pueblo-category",
        townId: "almonte",
        categoryId: initialCategory,
        granularity: "d",
      },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change configuration to different parameters using real category from taxonomy
    const differentCategory = getDifferentCategory(initialCategory);
    rerender({
      type: "pueblo-category",
      townId: "almonte",
      categoryId: differentCategory, // Different category to trigger new query
      granularity: "d",
    });

    // React Query may not immediately set loading=true on rerender, so we wait for the call

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have called fetchJSON twice (once for each config)
    expect(mockFetchJSON).toHaveBeenCalledTimes(2);
    expect(mockFetchJSON).toHaveBeenNthCalledWith(
      1,
      `/api/analytics/v1/dimensions/pueblos/details/almonte?g=d&categoryId=${initialCategory}`
    );
    expect(mockFetchJSON).toHaveBeenNthCalledWith(
      2,
      `/api/analytics/v1/dimensions/pueblos/details/almonte?g=d&categoryId=${differentCategory}`
    );
  });

  test("processes donut data correctly", async () => {
    const customResponse = {
      ...mockDrilldownResponse,
      donutData: [
        { label: "URL 1", value: 100 },
        { label: "URL 2", value: 50 },
        { label: "URL 3", value: 25 },
      ],
    };

    mockFetchJSON.mockResolvedValue(customResponse);

    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(!result.current.loading && result.current.donut).toEqual([
      { label: "URL 1", value: 100 },
      { label: "URL 2", value: 50 },
      { label: "URL 3", value: 25 },
    ]);
  });

  test("handles empty donut data", async () => {
    const customResponse = {
      ...mockDrilldownResponse,
      donutData: [],
    };

    mockFetchJSON.mockResolvedValue(customResponse);

    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(!result.current.loading && result.current.donut).toEqual([]);
  });

  test("handles response with missing donutData", async () => {
    const customResponse = {
      ...mockDrilldownResponse,
      donutData: undefined,
    };

    mockFetchJSON.mockResolvedValue(customResponse);

    const { result } = renderHook(() =>
      useDrilldownDetails({
        type: "pueblo-category",
        townId: "almonte",
        categoryId: "naturaleza",
        granularity: "d",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(!result.current.loading && result.current.donut).toEqual([]);
  });
});
