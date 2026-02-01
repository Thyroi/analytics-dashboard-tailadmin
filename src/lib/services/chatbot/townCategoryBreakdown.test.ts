/**
 * Tests unitarios para townCategoryBreakdown service
 *
 * Verifican:
 * - Totales por tags de categoría (v2)
 * - Delta percent = null si prev <= 0
 * - Renderiza TODAS las categorías (CATEGORY_ID_ORDER)
 * - Pattern correcto <town>.*
 */

import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchTownCategoryBreakdown } from "./townCategoryBreakdown";

describe("fetchTownCategoryBreakdown", () => {
  let fetchSpy: any;

  beforeEach(() => {
    // Mock global fetch
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe sumar totales por tags de categoría", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            { id: "playas", label: "Playas", total: 50 },
            { id: "sabor", label: "Sabor", total: 20 },
          ],
          data: {},
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas",
    );
    const saborCategory = result.categories.find(
      (c) => c.categoryId === "sabor",
    );

    expect(playasCategory?.currentTotal).toBe(50);
    expect(saborCategory?.currentTotal).toBe(20);
  });

  it("debe mapear tokens normalizados a CategoryId", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            { id: "Playas", label: "Playas", total: 25 },
            { id: "PLAYAS", label: "Playas", total: 15 },
            { id: "sabor", label: "Sabor", total: 30 },
          ],
          data: {},
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas",
    );
    expect(playasCategory?.currentTotal).toBe(40); // 25 + 15
  });

  it("debe retornar deltaPercent = null si prevTotal <= 0", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [{ id: "playas", label: "Playas", total: 50 }],
          data: {},
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas",
    );

    expect(playasCategory?.currentTotal).toBe(50);
    expect(playasCategory?.prevTotal).toBe(0);
    expect(playasCategory?.deltaPercent).toBeNull(); // null porque prev <= 0
    expect(playasCategory?.deltaAbs).toBe(50);
  });

  it("debe calcular deltaPercent correctamente cuando prev > 0", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [{ id: "playas", label: "Playas", total: 60 }],
          data: {},
          previous: {
            playas: [{ date: "20241019", value: 40 }],
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas",
    );

    expect(playasCategory?.currentTotal).toBe(60);
    expect(playasCategory?.prevTotal).toBe(40);
    expect(playasCategory?.deltaAbs).toBe(20);
    expect(playasCategory?.deltaPercent).toBe(50); // (60-40)/40 * 100 = 50%
  });

  it("debe renderizar TODAS las categorías aunque no tengan datos", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [{ id: "playas", label: "Playas", total: 10 }],
          data: {},
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que devuelve TODAS las categorías de CATEGORY_ID_ORDER
    expect(result.categories.length).toBeGreaterThanOrEqual(
      CATEGORY_ID_ORDER.length,
    );

    // Verificar que todas las categorías están presentes
    for (const expectedCategoryId of CATEGORY_ID_ORDER) {
      const category = result.categories.find(
        (c) => c.categoryId === expectedCategoryId,
      );
      expect(category).toBeDefined();

      if (expectedCategoryId === "playas") {
        expect(category?.currentTotal).toBe(10);
      } else {
        expect(category?.currentTotal).toBe(0); // Sin datos
        expect(category?.deltaPercent).toBeNull(); // prev también 0
      }
    }
  });

  it("debe usar el pattern correcto <town>.*", async () => {
    const mockResponse = {
      code: 200,
      output: {
        "hinojos.*": {
          region: null,
          topic: null,
          tags: [],
          data: {},
          previous: {},
        },
      },
    };

    fetchSpy.mockImplementation((_url: unknown, options: unknown) => {
      const body = JSON.parse((options as RequestInit).body as string);

      // Verificar que el pattern es correcto
      expect(body.patterns).toEqual(["hinojos.*"]);
      expect(body.id).toBe("huelva");

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    await fetchTownCategoryBreakdown({
      townId: "hinojos",
      windowGranularity: "w", // windowGranularity, pero request usa "d"
    });

    // fetchSpy ya verificó el pattern en su implementación
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("debe incluir el tag __others__ como 'Otros'", async () => {
    const pattern = "almonte.*";
    const mockResponse = {
      code: 200,
      output: {
        [pattern]: {
          region: null,
          topic: null,
          tags: [
            { id: "__others__", label: "Otros", total: 15 },
            { id: "playas", label: "Playas", total: 30 },
          ],
          data: {},
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

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que "otros" tiene el valor de la categoría desconocida
    const otrosCategory = result.categories.find(
      (c) => c.categoryId === "__others__",
    );
    expect(otrosCategory?.currentTotal).toBe(15);

    // Verificar que "playas" tiene su valor correcto
    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas",
    );
    expect(playasCategory?.currentTotal).toBe(30);
  });

  it("debe hacer un solo POST (current + previous en response)", async () => {
    const mockResponse = {
      code: 200,
      output: {
        "almonte.*": {
          region: null,
          topic: null,
          tags: [],
          data: {},
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

    await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que fetch fue llamado 1 vez
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("debe incluir meta con granularity, timezone y ranges", async () => {
    const mockResponse = {
      code: 200,
      output: {},
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "w",
      startISO: "2024-10-14",
      endISO: "2024-10-20",
    });

    // Verificar meta
    expect(result.meta.granularity).toBe("w");
    expect(result.meta.timezone).toBe("UTC");
    expect(result.meta.range.current).toBeDefined();
    expect(result.meta.range.previous).toBeDefined();
    expect(result.meta.range.current.start).toBe("2024-10-14");
    expect(result.meta.range.current.end).toBe("2024-10-20");
  });
});
