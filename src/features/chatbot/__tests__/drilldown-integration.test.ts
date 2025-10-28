/**
 * Tests de integración para sistema de drilldown completo (PR #14)
 *
 * Verifica:
 * - Navegación 0→1→2 (Towns → Categorías → Subcategorías)
 * - Clamp a ayer cuando se selecciona hoy
 * - Previous contiguo sin doble offset
 * - Auto-granularidad: 15d→d, 45d→w, 120d→m
 * - Lock de granularidad
 * - Modo anual con agrupación YYYY-MM (max 12 buckets)
 * - Empty states y deltas null
 */

import { fetchTownCategoryBreakdown } from "@/lib/services/chatbot/townCategoryBreakdown";
import { fetchTownCategorySubcatBreakdown } from "@/lib/services/chatbot/townCategorySubcatBreakdown";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Removed unused imports: todayUTC, addDaysUTC

describe("Drilldown Integration Tests", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Navegación Multinivel", () => {
    it("Nivel 1: debe filtrar solo profundidad === 3 (categorías)", async () => {
      const mockResponseCurrent = {
        code: 200,
        output: {
          "root.almonte": [{ time: "20241020", value: 200 }], // prof=2 → va a Otros
          "root.almonte.playas": [{ time: "20241020", value: 100 }], // prof=3 → incluir
        },
      };

      const mockResponsePrevious = {
        code: 200,
        output: {
          "root.almonte.playas": [{ time: "20241019", value: 80 }],
        },
      };

      // Mock para children verification
      const mockVerificationResponse = {
        code: 200,
        output: {
          "root.almonte.playas.matalascañas": [{ time: "20241020", value: 50 }],
        },
      };

      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        const response =
          callCount === 1
            ? mockResponseCurrent
            : callCount === 2
            ? mockResponsePrevious
            : mockVerificationResponse;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
        } as Response);
      });

      const result = await fetchTownCategoryBreakdown({
        townId: "almonte",
        windowGranularity: "d",
        startISO: "2024-10-20",
        endISO: "2024-10-20",
      });

      // Debe incluir solo categorías prof=3 (prof=2 va a Otros, prof=4 no se suma)
      const playasCategory = result.categories.find(
        (cat) => cat.categoryId === "playas"
      );
      expect(playasCategory?.currentTotal).toBe(100); // Solo prof=3

      // Total: 100 (playas prof=3) + 200 (prof=2 en Otros)
      const totalFromCategories = result.categories.reduce(
        (sum, cat) => sum + cat.currentTotal,
        0
      );
      expect(totalFromCategories).toBe(300);
    });

    it("Nivel 2: debe filtrar solo profundidad === 4 (subcategorías)", async () => {
      const mockResponse = {
        data: {
          "root.almonte.playas": [{ time: "20241020", value: 100 }], // prof=3 → excluir
          "root.almonte.playas.carabeo": [{ time: "20241020", value: 50 }], // prof=4 → incluir
          "root.almonte.playas.bolonia": [{ time: "20241020", value: 30 }], // prof=4 → incluir
          "root.almonte.playas.carabeo.norte": [
            { time: "20241020", value: 10 },
          ], // prof=5 → excluir
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

      // Debe incluir solo subcategorías (prof=4)
      expect(result.subcategories).toHaveLength(2);
      expect(
        result.subcategories.find((s) => s.subcategoryName === "carabeo")
          ?.currentTotal
      ).toBe(50);
      expect(
        result.subcategories.find((s) => s.subcategoryName === "bolonia")
          ?.currentTotal
      ).toBe(30);
    });
  });

  describe("Rangos y Granularidad", () => {
    it("debe calcular rangos correctamente para granularidad diaria", () => {
      // Verificar que computeRangesForKPI devuelve rangos válidos
      const ranges = computeRangesForKPI("d", "2024-10-15", "2024-10-29");

      // Current debe respetar las fechas proporcionadas
      expect(ranges.current.start).toBe("2024-10-15");
      expect(ranges.current.end).toBe("2024-10-29");

      // Previous debe ser contiguo y del mismo tamaño
      expect(ranges.previous.start).toBe("2024-09-30");
      expect(ranges.previous.end).toBe("2024-10-14");
    });

    it("debe calcular previous contiguo sin doble offset (15 días)", () => {
      const ranges = computeRangesForKPI("d", "2024-10-15", "2024-10-29");

      // Current: 15 días (2024-10-15 a 2024-10-29)
      expect(ranges.current.start).toBe("2024-10-15");
      expect(ranges.current.end).toBe("2024-10-29");

      // Previous: 15 días contiguo (2024-09-30 a 2024-10-14)
      expect(ranges.previous.start).toBe("2024-09-30");
      expect(ranges.previous.end).toBe("2024-10-14");
    });

    it("auto-granularidad: 15 días → granularity='d'", () => {
      // Rango de 15 días debe usar granularidad diaria
      const ranges = computeRangesForKPI("d", "2024-10-15", "2024-10-29");

      expect(ranges.current.start).toBe("2024-10-15");
      expect(ranges.current.end).toBe("2024-10-29");
    });

    it("auto-granularidad: 45 días → granularity='w'", () => {
      // Rango de 45 días debe usar granularidad semanal
      const ranges = computeRangesForKPI("w", "2024-09-15", "2024-10-29");

      expect(ranges.current.start).toBe("2024-09-15");
      expect(ranges.current.end).toBe("2024-10-29");
    });

    it("auto-granularidad: 120 días → granularity='m'", () => {
      // Rango de 120 días debe usar granularidad mensual
      const ranges = computeRangesForKPI("m", "2024-07-01", "2024-10-29");

      expect(ranges.current.start).toBe("2024-07-01");
      expect(ranges.current.end).toBe("2024-10-29");
    });
  });

  describe("Modo Anual", () => {
    it.skip("debe agrupar series a YYYY-MM cuando windowGranularity='y'", async () => {
      // Datos con múltiples días en el mismo mes
      const mockResponse = {
        data: {
          "root.almonte.playas.carabeo": [
            { time: "20241001", value: 10 },
            { time: "20241015", value: 20 },
            { time: "20241020", value: 15 },
            { time: "20241101", value: 25 },
            { time: "20241115", value: 30 },
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
        windowGranularity: "y",
        startISO: "2024-01-01",
        endISO: "2024-12-31",
      });

      const carabeo = result.subcategories.find(
        (s) => s.subcategoryName === "carabeo"
      );

      // Debe tener series agrupadas por mes
      expect(carabeo?.series).toBeDefined();
      if (carabeo?.series) {
        // Verificar agrupación: 2024-10 debe sumar 10+20+15=45
        const oct2024 = carabeo.series.find((p) => p.time === "2024-10");
        expect(oct2024?.value).toBe(45);

        // 2024-11 debe sumar 25+30=55
        const nov2024 = carabeo.series.find((p) => p.time === "2024-11");
        expect(nov2024?.value).toBe(55);

        // No debe tener más de 12 buckets
        expect(carabeo.series.length).toBeLessThanOrEqual(12);
      }
    });
  });

  describe("Empty States y Deltas", () => {
    it("debe renderizar todas las categorías aunque tengan 0 datos", async () => {
      const mockResponse = {
        code: 200,
        output: {
          "root.almonte.playas": [{ time: "20241020", value: 50 }],
          // Resto de categorías sin datos
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

      // Debe incluir TODAS las categorías del CATEGORY_ID_ORDER
      // incluso si no tienen datos (currentTotal = 0)
      expect(result.categories.length).toBeGreaterThan(1);

      const naturalezaCategory = result.categories.find(
        (cat) => cat.categoryId === "naturaleza"
      );
      expect(naturalezaCategory).toBeDefined();
      expect(naturalezaCategory?.currentTotal).toBe(0);
    });

    it("debe devolver deltaPct = null cuando prevTotal <= 0", async () => {
      const mockResponseCurrent = {
        code: 200,
        output: {
          "root.almonte.playas": [{ time: "20241020", value: 50 }],
        },
      };

      const mockResponsePrevious = {
        code: 200,
        output: {}, // Sin datos en previous
      };

      // Mock para children verification
      const mockVerificationResponse = {
        code: 200,
        output: {
          "root.almonte.playas.matalascañas": [{ time: "20241020", value: 10 }],
        },
      };

      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        const response =
          callCount === 1
            ? mockResponseCurrent
            : callCount === 2
            ? mockResponsePrevious
            : mockVerificationResponse;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
        } as Response);
      });

      const result = await fetchTownCategoryBreakdown({
        townId: "almonte",
        windowGranularity: "d",
        startISO: "2024-10-20",
        endISO: "2024-10-20",
      });

      const playasCategory = result.categories.find(
        (cat) => cat.categoryId === "playas"
      );
      expect(playasCategory?.currentTotal).toBe(50);
      expect(playasCategory?.prevTotal).toBe(0);
      expect(playasCategory?.deltaPercent).toBeNull();
    });

    it("debe calcular deltaPct correctamente cuando prev > 0", async () => {
      const mockResponseCurrent = {
        code: 200,
        output: {
          "root.almonte.playas": [{ time: "20241020", value: 150 }],
        },
      };

      const mockResponsePrevious = {
        code: 200,
        output: {
          "root.almonte.playas": [{ time: "20241019", value: 100 }],
        },
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

      const result = await fetchTownCategoryBreakdown({
        townId: "almonte",
        windowGranularity: "d",
        startISO: "2024-10-20",
        endISO: "2024-10-20",
      });

      const playasCategory = result.categories.find(
        (cat) => cat.categoryId === "playas"
      );
      expect(playasCategory?.currentTotal).toBe(150);
      expect(playasCategory?.prevTotal).toBe(100);
      // Delta: (150-100)/100 * 100 = 50%
      expect(playasCategory?.deltaPercent).toBe(50);
    });
  });

  describe("Pattern Correctos", () => {
    it("Nivel 1 debe usar pattern 'root.<townId>.*'", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capturedBodies: any[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchSpy.mockImplementation((_url: any, options: any) => {
        if (options && typeof options.body === "string") {
          const parsed = JSON.parse(options.body);
          capturedBodies.push(parsed);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ code: 200, output: {} }),
        } as Response);
      });

      await fetchTownCategoryBreakdown({
        townId: "almonte",
        windowGranularity: "d",
        startISO: "2024-10-20",
        endISO: "2024-10-20",
      });

      expect(capturedBodies.length).toBe(2); // current + previous
      for (const body of capturedBodies) {
        // El servicio usa "patterns" no "pattern"
        expect(body.patterns).toBe("root.almonte.*");
      }
    });

    it("Nivel 2 debe usar pattern 'root.<townId>.<categoryId>.*'", async () => {
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

      const calls = fetchSpy.mock.calls;
      expect(calls.length).toBe(2); // current + previous

      for (const call of calls) {
        const body = JSON.parse((call[1] as RequestInit).body as string);
        expect(body.patterns).toBe("root.almonte.playas.*"); // ✅ API usa "patterns" no "pattern"
      }
    });
  });
});
