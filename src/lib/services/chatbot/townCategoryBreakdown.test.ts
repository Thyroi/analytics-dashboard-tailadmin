/**
 * Tests unitarios para townCategoryBreakdown service
 *
 * Verifican:
 * - Filtrado por profundidad === 3
 * - Mapeo de sinónimos CATEGORY_SYNONYMS
 * - Delta percent = null si prev <= 0
 * - Renderiza TODAS las categorías (CATEGORY_ID_ORDER)
 * - Pattern correcto root.<townId>.*
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

  it("debe filtrar solo claves con profundidad >= 3", async () => {
    // Mock de respuesta con diferentes profundidades
    const mockResponse = {
      code: 200,
      output: {
        "root.almonte": [{ time: "20241020", value: 10 }], // prof=2 → ignorar
        "root.almonte.playas": [{ time: "20241020", value: 50 }], // prof=3 → incluir
        "root.almonte.playas.matalascanas": [{ time: "20241020", value: 30 }], // prof=4 → incluir (subcategoría)
        "root.almonte.sabor": [{ time: "20241020", value: 20 }], // prof=3 → incluir
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
      startISO: "2024-10-20",
      endISO: "2024-10-20",
    });

    // Verificar que se procesaron solo prof=3 (categorías nivel 1)
    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas"
    );
    const saborCategory = result.categories.find(
      (c) => c.categoryId === "sabor"
    );

    expect(playasCategory?.currentTotal).toBe(50); // Solo prof=3, prof=4 (subcategorías) no se suman
    expect(saborCategory?.currentTotal).toBe(20);

    // Verificar que NO incluyó prof=2 en los totales
    expect(playasCategory?.currentTotal).not.toBe(60); // 10 + 50 (incorrecto, incluiría prof=2)
  });

  it("debe mapear sinónimos correctamente a CategoryId", async () => {
    // Mock con diferentes sinónimos de categorías
    const mockResponse = {
      code: 200,
      output: {
        "root.almonte.playa": [{ time: "20241020", value: 25 }], // sinónimo de "playas"
        "root.almonte.beach": [{ time: "20241020", value: 15 }], // otro sinónimo
        "root.almonte.sabor": [{ time: "20241020", value: 30 }],
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que "playa" y "beach" se mapearon a "playas"
    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas"
    );
    expect(playasCategory?.currentTotal).toBe(40); // 25 + 15
  });

  it("debe retornar deltaPercent = null si prevTotal <= 0", async () => {
    const mockCurrentResponse = {
      code: 200,
      output: {
        "root.almonte.playas": [{ time: "20241020", value: 50 }],
      },
    };

    const mockPrevResponse = {
      code: 200,
      output: {
        // Sin datos en previous (prevTotal = 0)
      },
    };

    // Mock para children verification: debe devolver datos para que playas no se mueva a "otros"
    const mockVerificationResponse = {
      code: 200,
      output: {
        "root.almonte.playas.matalascañas": [{ time: "20241020", value: 10 }],
      },
    };

    let callCount = 0;
    fetchSpy.mockImplementation(() => {
      callCount++;
      // Primeras 2 llamadas: current y previous
      // Llamadas posteriores: verification
      const response =
        callCount === 1
          ? mockCurrentResponse
          : callCount === 2
          ? mockPrevResponse
          : mockVerificationResponse;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      } as Response);
    });

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas"
    );

    expect(playasCategory?.currentTotal).toBe(50);
    expect(playasCategory?.prevTotal).toBe(0);
    expect(playasCategory?.deltaPercent).toBeNull(); // null porque prev <= 0
    expect(playasCategory?.deltaAbs).toBe(50);
  });

  it("debe calcular deltaPercent correctamente cuando prev > 0", async () => {
    const mockCurrentResponse = {
      code: 200,
      output: {
        "root.almonte.playas": [{ time: "20241020", value: 60 }],
      },
    };

    const mockPrevResponse = {
      code: 200,
      output: {
        "root.almonte.playas": [{ time: "20241019", value: 40 }],
      },
    };

    let callCount = 0;
    fetchSpy.mockImplementation(() => {
      callCount++;
      const response = callCount === 1 ? mockCurrentResponse : mockPrevResponse;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      } as Response);
    });

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas"
    );

    expect(playasCategory?.currentTotal).toBe(60);
    expect(playasCategory?.prevTotal).toBe(40);
    expect(playasCategory?.deltaAbs).toBe(20);
    expect(playasCategory?.deltaPercent).toBe(50); // (60-40)/40 * 100 = 50%
  });

  it("debe renderizar TODAS las categorías aunque no tengan datos", async () => {
    const mockResponse = {
      code: 200,
      output: {
        "root.almonte.playas": [{ time: "20241020", value: 10 }],
        // Solo "playas" tiene datos
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que devuelve TODAS las categorías de CATEGORY_ID_ORDER
    expect(result.categories.length).toBeGreaterThanOrEqual(
      CATEGORY_ID_ORDER.length
    );

    // Verificar que todas las categorías están presentes
    for (const expectedCategoryId of CATEGORY_ID_ORDER) {
      const category = result.categories.find(
        (c) => c.categoryId === expectedCategoryId
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

  it("debe usar el pattern correcto root.<townId>.*", async () => {
    const mockResponse = {
      code: 200,
      output: {},
    };

    fetchSpy.mockImplementation((_url: unknown, options: unknown) => {
      const body = JSON.parse((options as RequestInit).body as string);

      // Verificar que el pattern es correcto
      expect(body.patterns).toBe("root.hinojos.*");
      expect(body.granularity).toBe("d");
      expect(body.db).toBe("project_huelva");

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

  it("debe mapear tokens no reconocidos a 'otros'", async () => {
    const mockResponse = {
      code: 200,
      output: {
        "root.almonte.categoria_desconocida": [{ time: "20241020", value: 15 }],
        "root.almonte.playas": [{ time: "20241020", value: 30 }],
      },
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que "otros" tiene el valor de la categoría desconocida
    const otrosCategory = result.categories.find(
      (c) => c.categoryId === "__others__"
    );
    expect(otrosCategory?.currentTotal).toBe(15);

    // Verificar que "playas" tiene su valor correcto
    const playasCategory = result.categories.find(
      (c) => c.categoryId === "playas"
    );
    expect(playasCategory?.currentTotal).toBe(30);
  });

  it("debe hacer dos POST paralelos (current + previous)", async () => {
    const mockResponse = {
      code: 200,
      output: {},
    };

    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    await fetchTownCategoryBreakdown({
      townId: "almonte",
      windowGranularity: "d",
    });

    // Verificar que fetch fue llamado 2 veces (current + previous)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
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
      } as Response)
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
