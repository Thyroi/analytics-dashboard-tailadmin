import type { Granularity } from "@/lib/types";
import {
  computeRangesForSeries,
  computeRangesFromQuery,
} from "@/lib/utils/time/timeWindows";
import { describe, expect, it } from "vitest";

describe("Granularity Ranges Debug", () => {
  const testDate = "2024-10-15"; // Un martes para el test

  it("should show ranges for different granularities", () => {
    const granularities: Granularity[] = ["d", "w", "m", "y"];

    granularities.forEach((granularity) => {
      const ranges = computeRangesFromQuery(granularity, testDate, testDate);

      // Verificación básica de que se generaron rangos válidos
      expect(ranges.current.start).toBeDefined();
      expect(ranges.current.end).toBeDefined();
      expect(ranges.previous.start).toBeDefined();
      expect(ranges.previous.end).toBeDefined();
    });
  });

  it("should verify granularity logic - behavior without params (useResumen hooks)", () => {
    const testCases = [
      {
        granularity: "d" as Granularity,
        expected: { currentDays: 7, previousDays: 7 },
      }, // Para series debe ser 7
      {
        granularity: "w" as Granularity,
        expected: { currentDays: 7, previousDays: 7 },
      },
      {
        granularity: "m" as Granularity,
        expected: { currentDays: 30, previousDays: 30 },
      }, // aproximado
    ];

    testCases.forEach(({ granularity, expected }) => {
      // Caso real: sin parámetros (como lo usan los hooks useResumen con comportamiento de series)
      const ranges = computeRangesForSeries(granularity);

      const currentDays = getDaysBetween(
        ranges.current.start,
        ranges.current.end
      );
      const previousDays = getDaysBetween(
        ranges.previous.start,
        ranges.previous.end
      );

      if (granularity !== "m") {
        // El mes puede variar
        expect(currentDays).toBe(expected.currentDays);
        expect(previousDays).toBe(expected.previousDays);
      }
    });
  });

  it("should ensure week includes 7 days and previous week is contiguo correctly", () => {
    // Para granularidad "w", usar solo endDate para obtener una semana completa
    const ranges = computeRangesForSeries("w", null, testDate);

    const currentDays = getDaysBetween(
      ranges.current.start,
      ranges.current.end
    );
    const previousDays = getDaysBetween(
      ranges.previous.start,
      ranges.previous.end
    );

    // Una semana debe tener exactamente 7 días
    expect(currentDays).toBe(7);
    expect(previousDays).toBe(7);

    // Verificar que el período anterior es contiguo al actual
    // NUEVO COMPORTAMIENTO: Previous termina 1 día antes de que inicie current
    const currentStart = new Date(ranges.current.start);
    const previousEnd = new Date(ranges.previous.end);

    // Previous.end debe ser exactamente 1 día antes de current.start
    const expectedPrevEnd = new Date(currentStart);
    expectedPrevEnd.setUTCDate(expectedPrevEnd.getUTCDate() - 1);

    expect(previousEnd.toISOString().split("T")[0]).toBe(
      expectedPrevEnd.toISOString().split("T")[0]
    );

    // Verificar que previous tiene la misma duración que current (ventana contigua)
    expect(previousDays).toBe(currentDays);
  });
});

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
}
