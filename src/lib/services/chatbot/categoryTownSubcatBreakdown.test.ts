import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCategoryTownSubcatBreakdown } from "./categoryTownSubcatBreakdown";

describe("fetchCategoryTownSubcatBreakdown", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe usar el pattern para Otros en category-first: 'otros.<categoria>'", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            output: {
              "otros.naturaleza": {
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

    await fetchCategoryTownSubcatBreakdown({
      categoryId: "naturaleza",
      townId: "otros",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    const calls = fetchSpy.mock.calls;
    expect(calls.length).toBe(1);
    const body = JSON.parse(calls[0][1].body);
    expect(body.patterns).toEqual(["otros.naturaleza"]);
  });
});
