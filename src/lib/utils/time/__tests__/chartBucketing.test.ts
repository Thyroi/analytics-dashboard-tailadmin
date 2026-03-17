import { describe, expect, it } from "vitest";
import {
  bucketSeriesPoints,
  buildChartBucketPlan,
  determineChartBucketGranularity,
} from "../chartBucketing";

describe("chartBucketing", () => {
  it("uses daily buckets up to 30 days", () => {
    expect(determineChartBucketGranularity(1)).toBe("d");
    expect(determineChartBucketGranularity(7)).toBe("d");
    expect(determineChartBucketGranularity(30)).toBe("d");
  });

  it("uses weekly buckets from 31 to 60 days", () => {
    expect(determineChartBucketGranularity(31)).toBe("w");
    expect(determineChartBucketGranularity(60)).toBe("w");
  });

  it("uses monthly buckets beyond 60 days", () => {
    expect(determineChartBucketGranularity(61)).toBe("m");
    expect(determineChartBucketGranularity(120)).toBe("m");
  });

  it("keeps a 7-day range as daily points", () => {
    const plan = buildChartBucketPlan("2026-03-04", "2026-03-10");

    expect(plan.bucketGranularity).toBe("d");
    expect(plan.bucketKeys).toHaveLength(7);
    expect(plan.bucketLabels[0]).toBe("04");
    expect(plan.bucketLabels[6]).toBe("10");

    const series = bucketSeriesPoints(
      [
        { label: "2026-03-04", value: 3 },
        { label: "2026-03-10", value: 2 },
      ],
      plan,
    );

    expect(series).toHaveLength(7);
    expect(series[0]).toEqual({ label: "04", value: 3 });
    expect(series[6]).toEqual({ label: "10", value: 2 });
  });

  it("aggregates a 40-day range into weekly buckets", () => {
    const plan = buildChartBucketPlan("2026-03-01", "2026-04-09");

    expect(plan.bucketGranularity).toBe("w");
    expect(plan.bucketKeys).toHaveLength(6);
    expect(plan.bucketLabels).toEqual([
      "26-w09",
      "26-w10",
      "26-w11",
      "26-w12",
      "26-w13",
      "26-w14",
    ]);

    const series = bucketSeriesPoints(
      [
        { label: "2026-03-01", value: 2 },
        { label: "2026-03-05", value: 3 },
        { label: "2026-03-20", value: 4 },
      ],
      plan,
    );

    expect(series.map((point) => point.value)).toEqual([5, 0, 4, 0, 0, 0]);
  });

  it("uses month labels beyond 60 days", () => {
    const plan = buildChartBucketPlan("2026-01-01", "2026-03-15");

    expect(plan.bucketGranularity).toBe("m");
    expect(plan.bucketLabels).toEqual(["ene", "feb", "mar"]);
  });
});
