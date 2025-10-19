import type { GA4Row } from "@/lib/utils/core/granularityMapping";
import {
  buildCategoriesDonutForTown,
  buildSeriesAndDonutFocused,
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

describe("buildSeriesAndDonutFocused", () => {
  test("processes chatbot data for category focus correctly", () => {
    const mockChatbotData = {
      output: {
        "root.playas.accesos": [
          { time: "20251014", value: 2 },
          { time: "20251015", value: 2 },
        ],
        "root.playas.limpieza": [{ time: "20251014", value: 2 }],
        "root.almonte.playas": [
          { time: "20251014", value: 3 },
          { time: "20251016", value: 1 },
        ],
        "root.genéricas del condado.playas.accesos": [
          { time: "20251015", value: 2 },
          { time: "20251017", value: 1 },
        ],
        "root.naturaleza.otros": [{ time: "20251014", value: 5 }],
      },
    };

    const config = {
      granularity: "d" as const,
      currentRange: { start: "2025-10-14", end: "2025-10-17" },
      prevRange: { start: "2025-10-13", end: "2025-10-16" }, // Shifted range
      focus: { type: "category" as const, id: "playas" },
    };

    const result = buildSeriesAndDonutFocused(config, mockChatbotData);

    // Verificar series CURRENT (2025-10-14 to 2025-10-17)
    expect(result.series.current).toEqual([
      { label: "2025-10-14", value: 7 }, // playas.accesos(2) + playas.limpieza(2) + almonte.playas(3)
      { label: "2025-10-15", value: 4 }, // playas.accesos(2) + genéricas.playas.accesos(2)
      { label: "2025-10-16", value: 1 }, // almonte.playas(1)
      { label: "2025-10-17", value: 1 }, // genéricas.playas.accesos(1)
    ]);

    // Verificar series PREVIOUS (2025-10-13 to 2025-10-16) - shifted range
    expect(result.series.previous).toEqual([
      { label: "2025-10-13", value: 0 }, // No data for this date
      { label: "2025-10-14", value: 7 }, // Same data as current 2025-10-14
      { label: "2025-10-15", value: 4 }, // Same data as current 2025-10-15
      { label: "2025-10-16", value: 1 }, // Same data as current 2025-10-16
    ]);

    // Verificar donut data (subcategorías de playas del ÚLTIMO DÍA solamente para granularidad 'd')
    // Para granularidad 'd', el donut solo usa el último día: 2025-10-17
    // Solo "root.genéricas del condado.playas.accesos" tiene datos en 2025-10-17 (value: 1)
    expect(result.donutData).toEqual([
      { label: "genéricas del condado", value: 1 }, // Solo datos del último día (2025-10-17)
    ]);
  });

  test("returns empty data when no matching category found", () => {
    const mockChatbotData = {
      output: {
        "root.naturaleza.otros": [{ time: "20251014", value: 5 }],
      },
    };

    const config = {
      granularity: "d" as const,
      currentRange: { start: "2025-10-14", end: "2025-10-17" },
      prevRange: { start: "2025-10-13", end: "2025-10-16" },
      focus: { type: "category" as const, id: "playas" },
    };

    const result = buildSeriesAndDonutFocused(config, mockChatbotData);

    expect(result.series.current.every((p) => p.value === 0)).toBe(true);
    expect(result.donutData).toEqual([]);
  });

  test("handles missing or invalid input data", () => {
    const config = {
      granularity: "d" as const,
      currentRange: { start: "2025-10-14", end: "2025-10-17" },
      prevRange: { start: "2025-10-13", end: "2025-10-16" },
      focus: { type: "category" as const, id: "playas" },
    };

    const result1 = buildSeriesAndDonutFocused(config, null);
    const result2 = buildSeriesAndDonutFocused(config, {});
    const result3 = buildSeriesAndDonutFocused(config, { output: null });

    [result1, result2, result3].forEach((result) => {
      expect(result.series.current.every((p) => p.value === 0)).toBe(true);
      expect(result.donutData).toEqual([]);
    });
  });

  test("demonstrates shifted ranges with different data", () => {
    const mockChatbotData = {
      output: {
        "root.naturaleza.parques": [
          { time: "20251010", value: 5 }, // Only in previous range
          { time: "20251011", value: 3 }, // Only in previous range
          { time: "20251012", value: 2 }, // In both previous and current
          { time: "20251013", value: 4 }, // In both previous and current
          { time: "20251014", value: 6 }, // Only in current range
          { time: "20251015", value: 1 }, // Only in current range
        ],
      },
    };

    const config = {
      granularity: "d" as const,
      currentRange: { start: "2025-10-12", end: "2025-10-15" }, // 4 days
      prevRange: { start: "2025-10-10", end: "2025-10-13" }, // 4 days, shifted back 2 days
      focus: { type: "category" as const, id: "naturaleza" },
    };

    const result = buildSeriesAndDonutFocused(config, mockChatbotData);

    // Current range: 2025-10-12 to 2025-10-15
    expect(result.series.current).toEqual([
      { label: "2025-10-12", value: 2 },
      { label: "2025-10-13", value: 4 },
      { label: "2025-10-14", value: 6 },
      { label: "2025-10-15", value: 1 },
    ]);

    // Previous range: 2025-10-10 to 2025-10-13 (shifted back)
    expect(result.series.previous).toEqual([
      { label: "2025-10-10", value: 5 },
      { label: "2025-10-11", value: 3 },
      { label: "2025-10-12", value: 2 },
      { label: "2025-10-13", value: 4 },
    ]);

    // Verify they have different axis labels and values
    expect(result.series.current.map((p) => p.label)).not.toEqual(
      result.series.previous.map((p) => p.label)
    );
  });

  test("donut uses only last day for daily granularity", () => {
    const mockChatbotData = {
      output: {
        "root.cultura.museos": [
          { time: "20251015", value: 10 }, // Should NOT appear in donut
          { time: "20251016", value: 8 }, // Should NOT appear in donut
          { time: "20251017", value: 5 }, // Should appear in donut (last day)
        ],
        "root.cultura.eventos": [
          { time: "20251015", value: 3 }, // Should NOT appear in donut
          { time: "20251017", value: 7 }, // Should appear in donut (last day)
        ],
        "root.almonte.cultura": [
          { time: "20251016", value: 2 }, // Should NOT appear in donut
          { time: "20251017", value: 4 }, // Should appear in donut (last day)
        ],
      },
    };

    const config = {
      granularity: "d" as const,
      currentRange: { start: "2025-10-15", end: "2025-10-17" }, // 3 days
      prevRange: { start: "2025-10-14", end: "2025-10-16" },
      focus: { type: "category" as const, id: "cultura" },
    };

    const result = buildSeriesAndDonutFocused(config, mockChatbotData);

    // Series should use all days in the range
    expect(result.series.current).toEqual([
      { label: "2025-10-15", value: 13 }, // museos(10) + eventos(3)
      { label: "2025-10-16", value: 10 }, // museos(8) + almonte(2)
      { label: "2025-10-17", value: 16 }, // museos(5) + eventos(7) + almonte(4)
    ]);

    // Donut should ONLY use the last day (2025-10-17) for granularity 'd'
    expect(result.donutData).toEqual([
      { label: "eventos", value: 7 }, // Only from 2025-10-17
      { label: "museos", value: 5 }, // Only from 2025-10-17
      { label: "almonte", value: 4 }, // Only from 2025-10-17
    ]);

    // Verify donut total equals only last day of series
    const donutTotal = result.donutData.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const lastDaySeriesValue =
      result.series.current[result.series.current.length - 1].value;
    expect(donutTotal).toBe(lastDaySeriesValue); // Both should be 16
  });
});
