import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTownCategorySubcatBreakdown } from "./townCategorySubcatBreakdown";

/**
 * Diagnostic test: reproduce user's scenario for "playas" vs "fiestasTradiciones"
 * - Mocks Mindsaic responses (current + previous)
 * - Calls the L2 service and inspects the returned subcategories and their series
 * - Prints helpful info to understand why series might be empty
 */

describe("diagnostic: playas vs fiestas (almonte, granularity=m)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("playas should produce subcategories with series", async () => {
    const mockCurrent = {
      output: {
        "root.almonte.playas.playa de la torre del loro": [
          { time: "20250924", value: 3 },
          { time: "20251001", value: 0 },
        ],
        "root.almonte.playas.accesos": [{ time: "20251005", value: 1 }],
        "root.almonte.playas.bandera": [{ time: "20251010", value: 0 }],
        "root.almonte.playas.chiringuitos": [{ time: "20251012", value: 0 }],
        "root.almonte.playas.perros": [{ time: "20251015", value: 0 }],
        "root.almonte.playas.servicios": [{ time: "20251018", value: 0 }],
      },
    };

    const mockPrevious = {
      output: {
        "root.almonte.playas.playa de la torre del loro": [
          { time: "20250825", value: 10 },
        ],
      },
    };

    let calls = 0;
    fetchSpy.mockImplementation(() => {
      calls++;
      const body = calls === 1 ? mockCurrent : mockPrevious; // current, previous
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as Response);
    });

    const res = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      representativeRawSegment: null,
      startISO: "2025-09-24",
      endISO: "2025-10-23",
      windowGranularity: "m",
      db: "project_huelva",
    });

    // Basic expectations
    expect(res.subcategories.length).toBeGreaterThan(0);

    // Find a known subcategory and assert we have a series array
    const target = res.subcategories.find((s) =>
      s.subcategoryName.includes("playa de la torre")
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
        (s.series || []).length
      )
    );
  });

  it("fiestasTradiciones should produce subcategories with series (diagnose differences)", async () => {
    // Here we simulate two different shapes we've seen in logs.
    // Scenario A: Mindsaic returns fine depth-4 keys under root.almonte.fiestasTradiciones.*
    const mockCurrentA = {
      output: {
        "root.almonte.fiestas y tradiciones.romeria": [
          { time: "20250926", value: 2 },
        ],
        "root.almonte.fiestas y tradiciones.feria": [
          { time: "20251002", value: 1 },
        ],
      },
    };

    const mockPreviousA = { output: {} };

    // Scenario B: Mindsaic returns aggregated or different-depth keys (buggy)
    const mockCurrentB = {
      output: {
        // aggregated to town level (depth 2) — parse should ignore these
        "root.almonte": [{ time: "20250924", value: 5 }],
        // or category present in different form
        "root.almonte.fiestas.romeria": [{ time: "20250926", value: 2 }],
      },
    };

    const mockPreviousB = {
      output: { "root.almonte": [{ time: "20250825", value: 8 }] },
    };

    // We'll run two sub-scenarios: A (expected) and B (problem).
    for (const [label, curr, prev] of [
      ["A-good", mockCurrentA, mockPreviousA],
      ["B-bad", mockCurrentB, mockPreviousB],
    ]) {
      let calls = 0;
      fetchSpy.mockImplementation(() => {
        calls++;
        const body = calls === 1 ? curr : prev;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(body),
        } as Response);
      });

      const res = await fetchTownCategorySubcatBreakdown({
        townId: "almonte",
        categoryId: "fiestasTradiciones",
        representativeRawSegment: null,
        startISO: "2025-09-24",
        endISO: "2025-10-23",
        windowGranularity: "m",
        db: "project_huelva",
      });

      console.log(
        `FIestas scenario ${label} -> subcats:`,
        res.subcategories.length
      );
      res.subcategories.forEach((s) =>
        console.log(
          label,
          s.subcategoryName,
          s.currentTotal,
          "series:",
          (s.series || []).length
        )
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
          (s) => (s.series || []).length > 0
        );
        // we don't force a fail; instead we log and assert that this reflects the problematic shape
        console.log("B-bad hasSeries?", hasSeries);
      }
    }
  });
});
