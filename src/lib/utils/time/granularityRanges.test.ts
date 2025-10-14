import {
  computeDailyRanges,
  computeDailyRangesForSeries,
  computeMonthlyRanges,
  computeWeeklyRanges,
} from "@/lib/utils/time/granularityRanges";
import { describe, expect, it } from "vitest";

describe("granularityRanges", () => {
  describe("computeDailyRanges (para donuts/KPIs)", () => {
    it("debe devolver 1 día para current y 1 día anterior para previous", () => {
      const result = computeDailyRanges("2025-10-13");

      expect(result.current).toEqual({
        start: "2025-10-13",
        end: "2025-10-13",
      });
      expect(result.previous).toEqual({
        start: "2025-10-12",
        end: "2025-10-12",
      });
    });
  });

  describe("computeDailyRangesForSeries (para series/gráficas)", () => {
    it("debe devolver 7 días para current con shift de 1 día para previous", () => {
      const result = computeDailyRangesForSeries("2025-10-13");

      // Current: Oct 7-13 (7 días)
      expect(result.current).toEqual({
        start: "2025-10-07",
        end: "2025-10-13",
      });

      // Previous: Oct 6-12 (mismo rango, shift 1 día)
      expect(result.previous).toEqual({
        start: "2025-10-06",
        end: "2025-10-12",
      });

      // Verificar que el shift es de 1 día, no 7
      const currentDays = getDaysDifference(
        result.current.start,
        result.current.end
      );
      const previousDays = getDaysDifference(
        result.previous.start,
        result.previous.end
      );
      expect(currentDays).toBe(7); // 7 días
      expect(previousDays).toBe(7); // 7 días
    });

    it("debe tener overlap de 6 días entre current y previous", () => {
      const result = computeDailyRangesForSeries("2025-10-13");

      // Current: Oct 7-13
      // Previous: Oct 6-12
      // Overlap: Oct 7-12 (6 días)
      expect(result.previous.end).toBe("2025-10-12");
      expect(result.current.start).toBe("2025-10-07");
    });
  });

  describe("computeWeeklyRanges", () => {
    it("debe devolver 7 días con shift de 1 día (igual que diaria)", () => {
      const result = computeWeeklyRanges("2025-10-13");

      // Current: Oct 7-13 (7 días)
      expect(result.current).toEqual({
        start: "2025-10-07",
        end: "2025-10-13",
      });

      // Previous: Oct 6-12 (shift 1 día)
      expect(result.previous).toEqual({
        start: "2025-10-06",
        end: "2025-10-12",
      });
    });

    it("debe tener la misma estructura que diaria para series", () => {
      const daily = computeDailyRangesForSeries("2025-10-13");
      const weekly = computeWeeklyRanges("2025-10-13");

      expect(daily.current).toEqual(weekly.current);
      expect(daily.previous).toEqual(weekly.previous);
    });
  });

  describe("computeMonthlyRanges", () => {
    it("debe devolver 30 días con shift de 1 día", () => {
      const result = computeMonthlyRanges("2025-10-13");

      // Current: Sep 14 - Oct 13 (30 días)
      expect(result.current).toEqual({
        start: "2025-09-14",
        end: "2025-10-13",
      });

      // Previous: Sep 13 - Oct 12 (shift 1 día)
      expect(result.previous).toEqual({
        start: "2025-09-13",
        end: "2025-10-12",
      });
    });

    it("debe tener 30 días en ambos rangos", () => {
      const result = computeMonthlyRanges("2025-10-13");

      const currentDays = getDaysDifference(
        result.current.start,
        result.current.end
      );
      const previousDays = getDaysDifference(
        result.previous.start,
        result.previous.end
      );

      expect(currentDays).toBe(30);
      expect(previousDays).toBe(30);
    });
  });
});

// Helper para calcular diferencia de días (inclusivo)
function getDaysDifference(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
}
