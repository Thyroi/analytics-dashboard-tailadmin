/**
 * Tests para townCategorySubcatBreakdown service (PR #13)
 *
 * Verifica:
 * - Filtrado profundidad==4
 * - Normalización de nombres de subcategorías
 * - Agrupación YYYY-MM para granularidad anual
 * - POST dual con pattern correcto
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

  it("debe filtrar solo claves con profundidad === 4", async () => {
    const mockResponse = {
      data: {
        "root.almonte.playas.carabeo": [{ time: "20241020", value: 50 }], // prof=4 → incluir
        "root.almonte.playas": [{ time: "20241020", value: 100 }], // prof=3 → excluir
        "root.almonte.playas.carabeo.extra": [{ time: "20241020", value: 10 }], // prof=5 → excluir
        "root.almonte.sabor.local": [{ time: "20241020", value: 30 }], // prof=4 → incluir
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

    // Verificar que solo se procesó profundidad==4
    const carabeoSubcat = result.subcategories.find(
      (s) => s.subcategoryName === "carabeo"
    );
    expect(carabeoSubcat?.currentTotal).toBe(50);

    // No debe incluir "local" porque es de categoría "sabor", no "playas"
    const localSubcat = result.subcategories.find(
      (s) => s.subcategoryName === "local"
    );
    expect(localSubcat).toBeUndefined();
  });

  it("debe normalizar nombres de subcategorías (trim, espacios, lowercase)", async () => {
    const mockResponse = {
      data: {
        "root.almonte.playas.Playa  del    Carmen": [
          { time: "20241020", value: 25 },
        ],
        "root.almonte.playas.playa  Del  CARMEN": [
          { time: "20241020", value: 15 },
        ],
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    // Debe agrupar las dos variantes en una sola subcategoría normalizada
    expect(result.subcategories).toHaveLength(1);
    expect(result.subcategories[0].subcategoryName).toBe("playa del carmen");
    expect(result.subcategories[0].currentTotal).toBe(40); // 25 + 15
  });

  it("debe usar el pattern correcto: root.<townId>.<categoryId>.*", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response)
    );

    await fetchTownCategorySubcatBreakdown({
      townId: "almonte",
      categoryId: "playas",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    // Verificar que ambos POSTs usan el pattern correcto
    const calls = fetchSpy.mock.calls;
    expect(calls.length).toBe(2); // current + previous

    for (const call of calls) {
      const body = JSON.parse(call[1].body);
      expect(body.patterns).toBe("root.almonte.playas.*");
      expect(body.granularity).toBe("d");
    }
  });

  it("debe calcular deltaPct = null si prevTotal <= 0", async () => {
    const mockResponseCurrent = {
      data: {
        "root.almonte.playas.carabeo": [{ time: "20241020", value: 50 }],
      },
    };

    const mockResponsePrevious = {
      data: {}, // Sin datos en previous
    };

    let callCount = 0;
    fetchSpy.mockImplementation(() => {
      callCount++;
      const response =
        callCount === 1 ? mockResponseCurrent : mockResponsePrevious;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      } as Response);
    });

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
        json: () => Promise.resolve({ data: {} }),
      } as Response)
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
