import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTownCategorySubcatBreakdown } from "./townCategorySubcatBreakdown";

/**
 * Diagnostic test: reproduce user's scenario for "playas" vs "fiestasTradiciones"
 * - Mocks Mindsaic responses (current + previous)
 * - Calls the L2 service and inspects the returned subcategories and their series
 * - Prints helpful info to understand why series might be empty
 */

describe("diagnostic: playas vs fiestas (almonte, granularity=m)", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("playas should produce subcategories with series", async () => {
    const pattern = "almonte.playas";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            {
              id: "playa_de_la_torre_del_loro",
              label: "Playa de la torre del loro",
              total: 3,
            },
          ],
          data: {
            playa_de_la_torre_del_loro: [
              { date: "20250924", value: 3 },
              { date: "20251001", value: 0 },
            ],
          },
          previous: {
            playa_de_la_torre_del_loro: [{ date: "20250825", value: 10 }],
          },
        },
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const res = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      startISO: "2025-09-24",
      endISO: "2025-10-23",
      windowGranularity: "m",
      db: "huelva",
    });

    // Basic expectations
    expect(res.subcategories.length).toBeGreaterThan(0);

    // Find a known subcategory and assert we have a series array
    const target = res.subcategories.find((s) =>
      s.subcategoryName.includes("Playa de la torre"),
    );
    expect(target).toBeDefined();
    // series should be an array (may be grouped or raw) and contain elements
    expect(Array.isArray(target?.series)).toBe(true);
    expect((target?.series ?? []).length).toBeGreaterThan(0);

    // Print debug info (Vitest will show console logs as part of test output)
    console.log("PLAYAS: subcategories count:", res.subcategories.length);
    res.subcategories.forEach((s) =>
      console.log(
        s.subcategoryName,
        s.currentTotal,
        "series:",
        (s.series || []).length,
      ),
    );
  });

  it("fiestasTradiciones should produce subcategories with series (diagnose differences)", async () => {
    const pattern = "almonte.fiestas_y_tradiciones";

    const mockResponseA = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            { id: "romeria", label: "Romería", total: 2 },
            { id: "feria", label: "Feria", total: 1 },
          ],
          data: {
            romeria: [{ date: "20250926", value: 2 }],
            feria: [{ date: "20251002", value: 1 }],
          },
          previous: {},
        },
      },
    };

    const mockResponseB = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [],
          data: {},
          previous: {},
        },
      },
    };

    for (const [label, response] of [
      ["A-good", mockResponseA],
      ["B-bad", mockResponseB],
    ]) {
      fetchSpy.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
        } as Response),
      );

      const res = await fetchTownCategorySubcatBreakdown({
        townId: "almonte",
        categoryId: "fiestasTradiciones",
        startISO: "2025-09-24",
        endISO: "2025-10-23",
        windowGranularity: "m",
        db: "huelva",
      });

      console.log(
        `FIestas scenario ${label} -> subcats:`,
        res.subcategories.length,
      );
      res.subcategories.forEach((s) =>
        console.log(
          label,
          s.subcategoryName,
          s.currentTotal,
          "series:",
          (s.series || []).length,
        ),
      );

      // Expectations: scenario A should have series present
      if (label === "A-good") {
        expect(res.subcategories.length).toBeGreaterThan(0);
        expect((res.subcategories[0].series || []).length).toBeGreaterThan(0);
      }

      // scenario B may show that series arrays are empty because parser ignored the keys
      if (label === "B-bad") {
        // we assert that either subcategories is empty or series are empty — this helps surface the bug
        const hasSeries = res.subcategories.some(
          (s) => (s.series || []).length > 0,
        );
        // we don't force a fail; instead we log and assert that this reflects the problematic shape
        console.log("B-bad hasSeries?", hasSeries);
      }
    }
  });
});
