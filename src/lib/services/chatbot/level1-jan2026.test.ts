import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLevel1Drilldown } from "./level1";

const JAN_START = "20260101";
const JAN_END = "20260131";
const GRANULARITIES: Array<"d" | "w" | "m" | "y"> = ["d", "w", "m", "y"];

function logBlock(title: string, payload?: Record<string, unknown>) {
  const suffix = payload ? ` ${JSON.stringify(payload, null, 2)}` : "";
  console.log(`\n[Level1 Jan-2026] ${title}${suffix}`);
}

function dayString(day: number): string {
  return `202601${String(day).padStart(2, "0")}`;
}

function buildSeries(
  base: number,
  spikes: Record<string, number>,
): Array<{ date: string; value: number }> {
  return Array.from({ length: 31 }, (_, i) => {
    const date = dayString(i + 1);
    return { date, value: base + (spikes[date] ?? 0) };
  });
}

function seriesValueByDate(
  series: Array<{ date: string; value: number }>,
  date: string,
): number {
  return series.find((point) => point.date === date)?.value ?? 0;
}

function sumChildrenByDate(
  children: Record<string, Array<{ date: string; value: number }>>,
  date: string,
): number {
  return Object.values(children).reduce(
    (sum, series) => sum + seriesValueByDate(series, date),
    0,
  );
}

function aggregateSeriesByTime(
  seriesBySlice: Record<string, Array<{ time: string; value: number }>>,
): Array<{ time: string; value: number }> {
  const map = new Map<string, number>();
  for (const series of Object.values(seriesBySlice)) {
    for (const point of series) {
      map.set(point.time, (map.get(point.time) ?? 0) + point.value);
    }
  }
  return Array.from(map.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function findMaxTwoDayWindow(series: Array<{ time: string; value: number }>) {
  let bestSum = -Infinity;
  let bestStart = series[0]?.time ?? "";
  let bestEnd = series[0]?.time ?? "";

  for (let i = 0; i < series.length - 1; i += 1) {
    const sum = series[i].value + series[i + 1].value;
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = series[i].time;
      bestEnd = series[i + 1].time;
    }
  }

  return { start: bestStart, end: bestEnd, sum: bestSum };
}

function previousDay(date: string): string {
  const day = Number(date.slice(-2));
  return `202601${String(day - 1).padStart(2, "0")}`;
}

function buildLevel1Output(
  pattern: string,
  children: Record<string, Array<{ date: string; value: number }>>,
  startTime: string,
  endTime: string,
) {
  const data: Record<string, Array<{ date: string; value: number }>> = {};
  const previous: Record<string, Array<{ date: string; value: number }>> = {};

  for (const [child, series] of Object.entries(children)) {
    if (startTime === JAN_START && endTime === JAN_END) {
      data[child] = series;
    } else {
      data[child] = [
        { date: startTime, value: seriesValueByDate(series, startTime) },
      ];
      const prevDate = previousDay(startTime);
      previous[child] = [
        { date: prevDate, value: seriesValueByDate(series, prevDate) },
      ];
    }
  }

  return {
    code: 200,
    output: {
      [pattern]: {
        region: null,
        topic: null,
        tags: [],
        data,
        previous: startTime === JAN_START ? {} : previous,
      },
    },
  };
}

function buildChildrenOutput(patterns: string[], startTime: string) {
  const output: Record<string, unknown> = {};
  for (const pattern of patterns) {
    output[pattern] = {
      region: null,
      topic: null,
      tags: [],
      data: {
        leaf: [{ date: startTime, value: 1 }],
      },
      previous: {},
    };
  }
  return { code: 200, output };
}

describe("Level1 enero 2026 - granularidad a granularidad", () => {
  let fetchSpy: any;

  const categoryScopeChildren = {
    almonte: buildSeries(10, {
      20260120: 80,
      20260121: 90,
    }),
    huelva: buildSeries(8, {
      20260120: 70,
      20260121: 60,
    }),
  };

  const townScopeChildren = {
    playas: buildSeries(12, {
      20260120: 60,
      20260121: 70,
    }),
    sabor: buildSeries(6, {
      20260120: 40,
      20260121: 30,
    }),
  };

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe validar ventana de 2 días y deltas para scope=category", async () => {
    const scopePattern = "*.playas";

    fetchSpy.mockImplementation(
      async (_input: RequestInfo, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          patterns?: string[];
          startTime?: string;
          endTime?: string;
        };
        const patterns = body.patterns ?? [];
        const startTime = body.startTime ?? JAN_START;
        const endTime = body.endTime ?? JAN_END;

        logBlock("Mock fetch (category)", {
          patterns,
          startTime,
          endTime,
        });

        if (patterns.length === 1 && patterns[0] === scopePattern) {
          logBlock("Mock response (category scope)", { scopePattern });
          const response = buildLevel1Output(
            scopePattern,
            categoryScopeChildren,
            startTime,
            endTime,
          );
          return {
            ok: true,
            json: async () => response,
          } as Response;
        }

        logBlock("Mock response (category children)", {
          count: patterns.length,
        });
        const response = buildChildrenOutput(patterns, startTime);
        return {
          ok: true,
          json: async () => response,
        } as Response;
      },
    );

    for (const granularity of GRANULARITIES) {
      logBlock("Granularity loop (category)", { granularity });
      const fullResult = await fetchLevel1Drilldown({
        scopeType: "category",
        scopeId: "playas",
        granularity,
        startTime: JAN_START,
        endTime: JAN_END,
      });

      const totalSeries = aggregateSeriesByTime(fullResult.seriesBySlice);
      const bestWindow = findMaxTwoDayWindow(totalSeries);

      logBlock("Best 2-day window (category)", {
        granularity,
        bestWindow,
        totalSeriesPoints: totalSeries.length,
      });

      expect(bestWindow.start).toBe("20260120");
      expect(bestWindow.end).toBe("20260121");
      expect(fullResult.meta.granularity).toBe(granularity);

      const singleResult = await fetchLevel1Drilldown({
        scopeType: "category",
        scopeId: "playas",
        granularity,
        startTime: bestWindow.end,
        endTime: bestWindow.end,
      });

      const expectedCurrent = sumChildrenByDate(
        categoryScopeChildren,
        bestWindow.end,
      );
      const expectedPrev = sumChildrenByDate(
        categoryScopeChildren,
        previousDay(bestWindow.end),
      );

      const prevRaw = singleResult.raw?.level1DataPrevious ?? {};
      const prevTotal = Object.values(prevRaw)
        .flat()
        .reduce((sum, point) => sum + point.value, 0);

      logBlock("Delta check (category)", {
        granularity,
        day: bestWindow.end,
        expectedCurrent,
        expectedPrev,
        resultCurrent: singleResult.total,
        resultPrev: prevTotal,
        expectedDeltaPct: computeDeltaPct(expectedCurrent, expectedPrev),
        resultDeltaPct: computeDeltaPct(singleResult.total, prevTotal),
      });

      expect(singleResult.total).toBe(expectedCurrent);
      expect(prevTotal).toBe(expectedPrev);
      expect(computeDeltaPct(singleResult.total, prevTotal)).toBe(
        computeDeltaPct(expectedCurrent, expectedPrev),
      );
    }
  });

  it("debe validar ventana de 2 días y deltas para scope=town", async () => {
    const scopePattern = "almonte.*";

    fetchSpy.mockImplementation(
      async (_input: RequestInfo, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          patterns?: string[];
          startTime?: string;
          endTime?: string;
        };
        const patterns = body.patterns ?? [];
        const startTime = body.startTime ?? JAN_START;
        const endTime = body.endTime ?? JAN_END;

        logBlock("Mock fetch (town)", {
          patterns,
          startTime,
          endTime,
        });

        if (patterns.length === 1 && patterns[0] === scopePattern) {
          logBlock("Mock response (town scope)", { scopePattern });
          const response = buildLevel1Output(
            scopePattern,
            townScopeChildren,
            startTime,
            endTime,
          );
          return {
            ok: true,
            json: async () => response,
          } as Response;
        }

        logBlock("Mock response (town children)", {
          count: patterns.length,
        });
        const response = buildChildrenOutput(patterns, startTime);
        return {
          ok: true,
          json: async () => response,
        } as Response;
      },
    );

    for (const granularity of GRANULARITIES) {
      logBlock("Granularity loop (town)", { granularity });
      const fullResult = await fetchLevel1Drilldown({
        scopeType: "town",
        scopeId: "almonte",
        granularity,
        startTime: JAN_START,
        endTime: JAN_END,
      });

      const totalSeries = aggregateSeriesByTime(fullResult.seriesBySlice);
      const bestWindow = findMaxTwoDayWindow(totalSeries);

      logBlock("Best 2-day window (town)", {
        granularity,
        bestWindow,
        totalSeriesPoints: totalSeries.length,
      });

      expect(bestWindow.start).toBe("20260120");
      expect(bestWindow.end).toBe("20260121");
      expect(fullResult.meta.granularity).toBe(granularity);

      const singleResult = await fetchLevel1Drilldown({
        scopeType: "town",
        scopeId: "almonte",
        granularity,
        startTime: bestWindow.end,
        endTime: bestWindow.end,
      });

      const expectedCurrent = sumChildrenByDate(
        townScopeChildren,
        bestWindow.end,
      );
      const expectedPrev = sumChildrenByDate(
        townScopeChildren,
        previousDay(bestWindow.end),
      );

      const prevRaw = singleResult.raw?.level1DataPrevious ?? {};
      const prevTotal = Object.values(prevRaw)
        .flat()
        .reduce((sum, point) => sum + point.value, 0);

      logBlock("Delta check (town)", {
        granularity,
        day: bestWindow.end,
        expectedCurrent,
        expectedPrev,
        resultCurrent: singleResult.total,
        resultPrev: prevTotal,
        expectedDeltaPct: computeDeltaPct(expectedCurrent, expectedPrev),
        resultDeltaPct: computeDeltaPct(singleResult.total, prevTotal),
      });

      expect(singleResult.total).toBe(expectedCurrent);
      expect(prevTotal).toBe(expectedPrev);
      expect(computeDeltaPct(singleResult.total, prevTotal)).toBe(
        computeDeltaPct(expectedCurrent, expectedPrev),
      );
    }
  });
});
