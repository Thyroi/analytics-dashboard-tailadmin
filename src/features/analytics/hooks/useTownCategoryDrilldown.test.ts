import { useTownCategoryDrilldown } from "@/features/analytics/hooks/useTownCategoryDrilldown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the useDrilldownDetails hook
vi.mock("./useDrilldownDetails", () => ({
  useDrilldownDetails: vi.fn(),
}));

// Import the mocked module to get access to the mock
import { useDrilldownDetails } from "./useDrilldownDetails";
const mockUseDrilldownDetails = vi.mocked(useDrilldownDetails);

const mockDrilldownResponse = {
  loading: false as const,
  donut: [
    {
      label: "Gastronomía",
      value: 50,
      url: "/analytics/2024-10-08_2024-10-10?g=d&townId=almonte&categoryId=gastronomia",
    },
    {
      label: "Naturaleza",
      value: 30,
      url: "/analytics/2024-10-08_2024-10-10?g=d&townId=almonte&categoryId=naturaleza",
    },
  ],
  deltaPct: 25,
  response: {
    granularity: "d" as const,
    range: {
      current: { start: "2025-10-08", end: "2025-10-10" },
      previous: { start: "2025-10-01", end: "2025-10-03" },
    },
    property: "properties/123456789",
    id: "almonte",
    title: "Almonte",
    series: {
      current: [
        { label: "2025-10-08", value: 100 },
        { label: "2025-10-09", value: 120 },
        { label: "2025-10-10", value: 90 },
      ],
      previous: [
        { label: "2025-10-01", value: 80 },
        { label: "2025-10-02", value: 95 },
        { label: "2025-10-03", value: 75 },
      ],
    },
    donutData: [
      { label: "gastronomia", value: 50 },
      { label: "naturaleza", value: 30 },
    ],
    deltaPct: 25,
  },
};

describe("useTownCategoryDrilldown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("correctly configures useDrilldownDetails for pueblo-category flow", () => {
    mockUseDrilldownDetails.mockReturnValue(mockDrilldownResponse);

    renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "gastronomia" as CategoryId,
        granularity: "d",
        endISO: "2025-10-15",
      })
    );

    expect(mockUseDrilldownDetails).toHaveBeenCalledWith({
      type: "pueblo-category",
      townId: "almonte",
      categoryId: "gastronomia",
      granularity: "d",
      endISO: "2025-10-15",
    });
  });

  test("handles different granularities correctly", () => {
    mockUseDrilldownDetails.mockReturnValue(mockDrilldownResponse);

    renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "naturaleza" as CategoryId,
        granularity: "w",
      })
    );

    expect(mockUseDrilldownDetails).toHaveBeenCalledWith({
      type: "pueblo-category",
      townId: "almonte",
      categoryId: "naturaleza",
      granularity: "w",
      endISO: undefined,
    });
  });

  test("transforms drilldown response to legacy format correctly", () => {
    mockUseDrilldownDetails.mockReturnValue(mockDrilldownResponse);

    const { result } = renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "gastronomia" as CategoryId,
        granularity: "d",
      })
    );

    expect(result.current).toEqual({
      loading: false,
      xLabels: ["2025-10-08", "2025-10-09", "2025-10-10"],
      seriesByUrl: [
        {
          name: "Gastronomía",
          data: [],
          path: "Gastronomía",
        },
        {
          name: "Naturaleza",
          data: [],
          path: "Naturaleza",
        },
      ],
      donut: mockDrilldownResponse.donut,
      deltaPct: 25,
    });
  });

  test("handles loading state correctly", () => {
    const loadingResponse = {
      loading: true as const,
    };

    mockUseDrilldownDetails.mockReturnValue(loadingResponse);

    const { result } = renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "gastronomia" as CategoryId,
        granularity: "d",
      })
    );

    expect(result.current).toEqual({
      loading: true,
      xLabels: [],
      seriesByUrl: [],
      donut: [],
      deltaPct: 0,
    });
  });

  test("reacts to parameter changes correctly", () => {
    mockUseDrilldownDetails.mockReturnValue(mockDrilldownResponse);

    const { rerender } = renderHook(
      (props) => useTownCategoryDrilldown(props),
      {
        initialProps: {
          townId: "almonte" as TownId,
          categoryId: "gastronomia" as CategoryId,
          granularity: "d" as const,
        },
      }
    );

    expect(mockUseDrilldownDetails).toHaveBeenLastCalledWith({
      type: "pueblo-category",
      townId: "almonte",
      categoryId: "gastronomia",
      granularity: "d",
      endISO: undefined,
    });

    // Change the parameters
    rerender({
      townId: "sevilla" as TownId,
      categoryId: "naturaleza" as CategoryId,
      granularity: "d",
    });

    expect(mockUseDrilldownDetails).toHaveBeenLastCalledWith({
      type: "pueblo-category",
      townId: "sevilla",
      categoryId: "naturaleza",
      granularity: "d",
      endISO: undefined,
    });
  });

  test("maintains backward compatibility with original interface", () => {
    mockUseDrilldownDetails.mockReturnValue(mockDrilldownResponse);

    const { result } = renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "gastronomia" as CategoryId,
        granularity: "d",
      })
    );

    // Verify that all expected properties are available in legacy format
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("xLabels");
    expect(result.current).toHaveProperty("seriesByUrl");
    expect(result.current).toHaveProperty("donut");
    expect(result.current).toHaveProperty("deltaPct");

    // Verify types
    expect(typeof result.current.loading).toBe("boolean");
    expect(Array.isArray(result.current.xLabels)).toBe(true);
    expect(Array.isArray(result.current.seriesByUrl)).toBe(true);
    expect(Array.isArray(result.current.donut)).toBe(true);
    expect(typeof result.current.deltaPct).toBe("number");
  });

  test("correctly extracts xLabels from series data", () => {
    const responseWithDifferentLabels = {
      ...mockDrilldownResponse,
      response: {
        ...mockDrilldownResponse.response,
        series: {
          current: [
            { label: "2025-01-01", value: 100 },
            { label: "2025-01-02", value: 150 },
            { label: "2025-01-03", value: 200 },
          ],
          previous: [],
        },
        donutData: [
          { label: "gastronomia", value: 50 },
          { label: "naturaleza", value: 30 },
        ],
        deltaPct: 25,
      },
    };

    mockUseDrilldownDetails.mockReturnValue(responseWithDifferentLabels);

    const { result } = renderHook(() =>
      useTownCategoryDrilldown({
        townId: "almonte" as TownId,
        categoryId: "gastronomia" as CategoryId,
        granularity: "d",
      })
    );

    expect(result.current.xLabels).toEqual([
      "2025-01-01",
      "2025-01-02",
      "2025-01-03",
    ]);
  });
});
