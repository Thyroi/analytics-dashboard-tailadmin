/**
 * Tests para townCategorySubcatBreakdown service (PR #13)
 *
 * Verifica:
 * - Subcategorías desde tags (v2)
 * - Agrupación YYYY-MM para granularidad anual
 * - POST único con pattern correcto
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTownCategorySubcatBreakdown } from "./townCategorySubcatBreakdown";

describe("fetchTownCategorySubcatBreakdown", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe mapear subcategorías desde tags", async () => {
    const pattern = "almonte.playas";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [{ id: "carabeo", label: "Carabeo", total: 50 }],
          data: {
            carabeo: [{ date: "20241020", value: 50 }],
          },
          previous: {},
        },
      },
    };

    fetchSpy.mockImplementation(() => {
      // Simular respuestas current y previous
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    const result = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    const carabeoSubcat = result.subcategories.find(
      (s) => s.subcategoryName === "Carabeo",
    );
    expect(carabeoSubcat?.currentTotal).toBe(50);
  });

  it("debe usar label si está disponible", async () => {
    const pattern = "almonte.playas";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            {
              id: "playa_del_carmen",
              label: "Playa del Carmen",
              total: 40,
            },
          ],
          data: {
            playa_del_carmen: [{ date: "20241020", value: 40 }],
          },
          previous: {},
        },
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const result = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    expect(result.subcategories).toHaveLength(1);
    expect(result.subcategories[0].subcategoryName).toBe("Playa del Carmen");
    expect(result.subcategories[0].currentTotal).toBe(40);
  });

  it("debe usar el pattern correcto: <town>.<category>", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            output: {
              "almonte.playas": {
                region: null,
                topic: null,
                tags: [],
                data: {},
                previous: {},
              },
            },
          }),
      } as Response),
    );

    await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    const calls = fetchSpy.mock.calls;
    expect(calls.length).toBe(1);
    const body = JSON.parse(calls[0][1].body);
    expect(body.patterns).toEqual(["almonte.playas"]);
    expect(body.id).toBe("huelva");
  });

  it("debe calcular deltaPct = null si prevTotal <= 0", async () => {
    const pattern = "almonte.playas";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [{ id: "carabeo", label: "Carabeo", total: 50 }],
          data: {
            carabeo: [{ date: "20241020", value: 50 }],
          },
          previous: {},
        },
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const result = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    const carabeoSubcat = result.subcategories[0];
    expect(carabeoSubcat.currentTotal).toBe(50);
    expect(carabeoSubcat.prevTotal).toBe(0);
    expect(carabeoSubcat.deltaPercent).toBeNull();
  });

  it("debe devolver metadata correcta", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            output: {
              "almonte.playas": {
                region: null,
                topic: null,
                tags: [],
                data: {},
                previous: {},
              },
            },
          }),
      } as Response),
    );

    const result = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "m",
      startISO: "2024-10-01",
      endISO: "2024-10-31",
    });

    expect(result.townId).toBe("almonte");
    expect(result.categoryId).toBe("playas");
    expect(result.meta.granularity).toBe("m");
    expect(result.meta.timezone).toBe("UTC");
    expect(result.meta.range.current).toBeDefined();
    expect(result.meta.range.previous).toBeDefined();
  });
});
