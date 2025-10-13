import type { GA4Row } from "@/lib/utils/core/granularityMapping";
import {
  buildCategoriesDonutForTown,
  buildTownsDonutForCategory,
  buildUrlsDonutForCategoryTown,
  buildUrlsDonutForTownCategory,
} from "@/lib/utils/data/seriesAndDonuts";
import { describe, expect, test } from "vitest";

// Mock data helpers
const createMockGA4Row = (
  date: string,
  url: string,
  value: number
): GA4Row => ({
  dimensionValues: [{ value: date }, { value: url }],
  metricValues: [{ value: value.toString() }],
});

const mockMatchTownIdFromPath = (path: string): string | null => {
  if (path.includes("/almonte/")) return "almonte";
  if (path.includes("/huelva/")) return "huelva";
  if (path.includes("/moguer/")) return "moguer";
  return null;
};

const mockMatchCategoryIdFromPath = (path: string): string | null => {
  if (path.includes("/naturaleza/")) return "naturaleza";
  if (path.includes("/cultura/")) return "cultura";
  if (path.includes("/gastronomia/")) return "gastronomia";
  return null;
};

describe("buildUrlsDonutForTownCategory", () => {
  const mockRows: GA4Row[] = [
    createMockGA4Row(
      "20251010",
      "https://example.com/almonte/naturaleza/donana-park",
      50
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/almonte/naturaleza/beach-guide",
      30
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/almonte/cultura/museum",
      20
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/huelva/naturaleza/river-tour",
      40
    ),
    createMockGA4Row(
      "20251009",
      "https://example.com/almonte/naturaleza/hiking-trail",
      25
    ), // Previous day
    createMockGA4Row(
      "20251011",
      "https://example.com/almonte/naturaleza/bird-watching",
      35
    ), // Next day
  ];

  test("filters by town and category correctly", () => {
    const result = buildUrlsDonutForTownCategory(
      mockRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        label: "https://example.com/almonte/naturaleza/donana-park",
        value: 50,
      },
      {
        label: "https://example.com/almonte/naturaleza/beach-guide",
        value: 30,
      },
    ]);
  });

  test("returns empty array when no matches found", () => {
    const result = buildUrlsDonutForTownCategory(
      mockRows,
      mockMatchTownIdFromPath,
      "sevilla", // Non-existent town
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toEqual([]);
  });

  test("filters by date range correctly", () => {
    const result = buildUrlsDonutForTownCategory(
      mockRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-09",
      "2025-10-09",
      "d"
    );

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe(
      "https://example.com/almonte/naturaleza/hiking-trail"
    );
    expect(result[0].value).toBe(25);
  });

  test("sorts results by value in descending order", () => {
    const testRows: GA4Row[] = [
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/low-value",
        10
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/high-value",
        100
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/medium-value",
        50
      ),
    ];

    const result = buildUrlsDonutForTownCategory(
      testRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toEqual([
      {
        label: "https://example.com/almonte/naturaleza/high-value",
        value: 100,
      },
      {
        label: "https://example.com/almonte/naturaleza/medium-value",
        value: 50,
      },
      { label: "https://example.com/almonte/naturaleza/low-value", value: 10 },
    ]);
  });

  test("handles missing or invalid data gracefully", () => {
    const invalidRows: GA4Row[] = [
      { dimensionValues: [], metricValues: [] },
      {
        dimensionValues: [{ value: undefined }],
        metricValues: [{ value: undefined }],
      },
      {
        dimensionValues: [{ value: "20251010" }],
        metricValues: [{ value: "invalid" }],
      },
    ];

    const result = buildUrlsDonutForTownCategory(
      invalidRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toEqual([]);
  });

  test("aggregates values for duplicate URLs", () => {
    const duplicateRows: GA4Row[] = [
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/same-url",
        30
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/same-url",
        20
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/different-url",
        15
      ),
    ];

    const result = buildUrlsDonutForTownCategory(
      duplicateRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toEqual([
      { label: "https://example.com/almonte/naturaleza/same-url", value: 50 },
      {
        label: "https://example.com/almonte/naturaleza/different-url",
        value: 15,
      },
    ]);
  });
});

describe("buildUrlsDonutForCategoryTown", () => {
  const mockRows: GA4Row[] = [
    createMockGA4Row(
      "20251010",
      "https://example.com/almonte/naturaleza/donana-park",
      50
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/huelva/naturaleza/river-tour",
      40
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/almonte/cultura/museum",
      30
    ),
    createMockGA4Row(
      "20251010",
      "https://example.com/moguer/naturaleza/beach",
      25
    ),
  ];

  test("filters by category and town correctly", () => {
    const result = buildUrlsDonutForCategoryTown(
      mockRows,
      mockMatchCategoryIdFromPath,
      "naturaleza",
      mockMatchTownIdFromPath,
      "almonte",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      label: "https://example.com/almonte/naturaleza/donana-park",
      value: 50,
    });
  });

  test("returns all URLs for category when no town filter", () => {
    // Test that the function works for category filtering
    const result = buildUrlsDonutForCategoryTown(
      mockRows,
      mockMatchCategoryIdFromPath,
      "naturaleza",
      mockMatchTownIdFromPath,
      "huelva",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe(
      "https://example.com/huelva/naturaleza/river-tour"
    );
  });
});

describe("Donut functions integration", () => {
  test("buildCategoriesDonutForTown vs buildUrlsDonutForTownCategory behavior", () => {
    const mockRows: GA4Row[] = [
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/park1",
        30
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/park2",
        20
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/cultura/museum",
        25
      ),
    ];

    // Categories donut (without filter)
    const categoriesResult = buildCategoriesDonutForTown(
      mockRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    // URLs donut (with category filter)
    const urlsResult = buildUrlsDonutForTownCategory(
      mockRows,
      mockMatchTownIdFromPath,
      "almonte",
      mockMatchCategoryIdFromPath,
      "naturaleza",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    // Categories donut should aggregate by category
    expect(categoriesResult).toEqual([
      { label: "naturaleza", value: 50 },
      { label: "cultura", value: 25 },
    ]);

    // URLs donut should show individual URLs for the filtered category
    expect(urlsResult).toEqual([
      { label: "https://example.com/almonte/naturaleza/park1", value: 30 },
      { label: "https://example.com/almonte/naturaleza/park2", value: 20 },
    ]);
  });

  test("buildTownsDonutForCategory vs buildUrlsDonutForCategoryTown behavior", () => {
    const mockRows: GA4Row[] = [
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/park",
        40
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/huelva/naturaleza/river",
        30
      ),
      createMockGA4Row(
        "20251010",
        "https://example.com/almonte/naturaleza/beach",
        20
      ),
    ];

    // Towns donut (without filter)
    const townsResult = buildTownsDonutForCategory(
      mockRows,
      mockMatchCategoryIdFromPath,
      "naturaleza",
      mockMatchTownIdFromPath,
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    // URLs donut (with town filter)
    const urlsResult = buildUrlsDonutForCategoryTown(
      mockRows,
      mockMatchCategoryIdFromPath,
      "naturaleza",
      mockMatchTownIdFromPath,
      "almonte",
      "2025-10-10",
      "2025-10-10",
      "d"
    );

    // Towns donut should aggregate by town
    expect(townsResult).toEqual([
      { label: "almonte", value: 60 },
      { label: "huelva", value: 30 },
    ]);

    // URLs donut should show individual URLs for the filtered town
    expect(urlsResult).toEqual([
      { label: "https://example.com/almonte/naturaleza/park", value: 40 },
      { label: "https://example.com/almonte/naturaleza/beach", value: 20 },
    ]);
  });
});
