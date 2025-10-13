import { expectStatus } from "@/../__tests__/utils/api-test-helpers";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock dependencies with inline implementations
vi.mock("@/lib/utils/analytics/ga", () => ({
  getAuth: vi.fn(() => ({
    getClient: vi.fn(),
    getAccessToken: vi.fn(),
  })),
  normalizePropertyId: vi.fn(() => "properties/123456789"),
  resolvePropertyId: vi.fn(() => "123456789"),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({
        getClient: vi.fn(),
        getAccessToken: vi.fn(),
      })),
    },
    analyticsdata: vi.fn(() => ({
      properties: {
        runReport: vi.fn().mockResolvedValue({
          data: {
            rows: [
              {
                dimensionValues: [
                  { value: "20251010" },
                  { value: "https://example.com/almonte/naturaleza/donana" },
                ],
                metricValues: [{ value: "100" }],
              },
            ],
          },
        }),
      },
    })),
  },
}));

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn(),
    getAccessToken: vi.fn(),
  })),
}));

vi.mock("@/lib/utils/data/seriesAndDonuts", () => ({
  buildTownsDonutForCategory: vi.fn(() => [
    { label: "almonte", value: 120 },
    { label: "huelva", value: 80 },
  ]),
  buildUrlsDonutForCategoryTown: vi.fn(() => [
    { label: "https://example.com/almonte/naturaleza/donana", value: 80 },
    { label: "https://example.com/almonte/naturaleza/beach", value: 40 },
  ]),
}));

vi.mock("@/lib/utils/core/granularityMapping", () => ({
  mapDataByGranularity: vi.fn(() => ({
    currentSeries: [15, 25, 35],
    previousSeries: [10, 20, 30],
    totalCurrent: 75,
    totalPrevious: 60,
    xLabels: ["2025-10-08", "2025-10-09", "2025-10-10"],
    previousLabels: ["2025-10-01", "2025-10-02", "2025-10-03"],
  })),
  formatSeriesWithGranularity: vi.fn(() => ({
    current: [
      { label: "2025-10-08", value: 15 },
      { label: "2025-10-09", value: 25 },
      { label: "2025-10-10", value: 35 },
    ],
    previous: [
      { label: "2025-10-01", value: 10 },
      { label: "2025-10-02", value: 20 },
      { label: "2025-10-03", value: 30 },
    ],
  })),
}));

vi.mock("@/lib/utils/time/granularityRanges", () => ({
  computeRangesByGranularity: vi.fn(() => ({
    current: { start: "2025-10-08", end: "2025-10-10" },
    previous: { start: "2025-10-01", end: "2025-10-03" },
  })),
  computeCustomRanges: vi.fn(() => ({
    optimalGranularity: "d",
    durationDays: 3,
  })),
  debugRanges: vi.fn(),
}));

vi.mock("@/lib/utils/time/timeWindows", () => ({
  computeDeltaPct: vi.fn(() => 25.0),
}));

// Import after mocks are set up
import { GET } from "@/app/api/analytics/v1/dimensions/categorias/details/[id]/route";

const createMockRequest = (url: string): NextRequest => {
  return new NextRequest(new URL(url, "http://localhost:3000"));
};

const createMockContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe("/api/analytics/v1/dimensions/categorias/details/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns categoria data without filters (towns donut)", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d"
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(
      response,
      200,
      "returns categoria data without filters (towns donut)"
    );

    const data = await response.json();

    expect(data).toMatchObject({
      granularity: "d",
      id: "naturaleza",
      title: expect.any(String),
      series: {
        current: expect.any(Array),
        previous: expect.any(Array),
      },
      donutData: [
        { label: "almonte", value: 120 },
        { label: "huelva", value: 80 },
      ],
      deltaPct: 25.0,
    });

    // Verify buildTownsDonutForCategory was called (no filter)
    const { buildTownsDonutForCategory } = await import(
      "@/lib/utils/data/seriesAndDonuts"
    );
    expect(buildTownsDonutForCategory).toHaveBeenCalledWith(
      expect.any(Array), // rows
      expect.any(Function), // matchCategoryIdFromPath
      "naturaleza", // categoryId
      expect.any(Function), // matchTownIdFromPath
      expect.any(String), // donutStart
      expect.any(String), // donutEnd
      "d" // granularity
    );
  });

  test("returns categoria data with townId filter (URLs donut)", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d&townId=almonte"
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(response, 200);

    const data = await response.json();

    expect(data).toMatchObject({
      granularity: "d",
      id: "naturaleza",
      title: expect.any(String),
      donutData: [
        { label: "https://example.com/almonte/naturaleza/donana", value: 80 },
        { label: "https://example.com/almonte/naturaleza/beach", value: 40 },
      ],
    });

    // Verify buildUrlsDonutForCategoryTown was called (with filter)
    const { buildUrlsDonutForCategoryTown } = await import(
      "@/lib/utils/data/seriesAndDonuts"
    );
    expect(buildUrlsDonutForCategoryTown).toHaveBeenCalledWith(
      expect.any(Array), // filteredRows
      expect.any(Function), // matchCategoryIdFromPath
      "naturaleza", // categoryId
      expect.any(Function), // matchTownIdFromPath
      "almonte", // townFilter
      expect.any(String), // donutStart
      expect.any(String), // donutEnd
      "d" // granularity
    );
  });

  test("handles custom date ranges", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d&start=2025-10-01&end=2025-10-05"
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(response, 200);

    const data = await response.json();
    expect(data.range).toMatchObject({
      current: { start: "2025-10-01", end: "2025-10-05" },
      previous: { start: "2025-10-01", end: "2025-10-05" },
    });
  });

  test("returns 400 for invalid category ID", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/invalid-category?g=d"
    );
    const context = createMockContext("invalid-category");

    const response = await GET(request, context);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Invalid categoryId");
  });

  test("handles different granularities", async () => {
    const testCases = ["d", "w", "m", "y"];

    for (const granularity of testCases) {
      const request = createMockRequest(
        `/api/analytics/v1/dimensions/categorias/details/naturaleza?g=${granularity}`
      );
      const context = createMockContext("naturaleza");

      const response = await GET(request, context);
      await expectStatus(response, 200);

      const data = await response.json();
      expect(data.granularity).toBe(granularity);
    }
  });

  test("includes debug information", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d"
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(response, 200);
    const data = await response.json();

    expect(data.debug).toMatchObject({
      totalRows: expect.any(Number),
      filteredRows: expect.any(Number),
      townFilter: null,
      matchedRows: expect.any(Number),
      currentTotal: expect.any(Number),
      previousTotal: expect.any(Number),
    });
  });

  test("includes debug information with town filter", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d&townId=almonte"
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(response, 200);
    const data = await response.json();

    expect(data.debug).toMatchObject({
      totalRows: expect.any(Number),
      filteredRows: expect.any(Number),
      townFilter: "almonte",
      matchedRows: expect.any(Number),
      currentTotal: expect.any(Number),
      previousTotal: expect.any(Number),
    });
  });

  test("handles edge case with empty townId filter", async () => {
    const request = createMockRequest(
      "/api/analytics/v1/dimensions/categorias/details/naturaleza?g=d&townId="
    );
    const context = createMockContext("naturaleza");

    const response = await GET(request, context);
    await expectStatus(response, 200);

    const data = await response.json();
    // Empty townId should be treated as no filter
    expect(data.debug.townFilter).toBe("");
  });
});
