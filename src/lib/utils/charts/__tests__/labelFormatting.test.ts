import { describe, expect, it } from "vitest";
import {
  formatChartLabelsSimple,
  formatNormalizedChartLabel,
} from "../labelFormatting";

describe("labelFormatting", () => {
  it("formats daily labels as dd for d/w/m", () => {
    expect(formatNormalizedChartLabel("2026-03-04", "d")).toBe("04");
    expect(formatNormalizedChartLabel("2026-03-04", "w")).toBe("04");
    expect(formatNormalizedChartLabel("2026-03-04", "m")).toBe("04");
  });

  it("formats weekly labels as yy-wNN", () => {
    expect(formatNormalizedChartLabel("2026-W09", "w")).toBe("26-w09");
  });

  it("formats yearly and monthly labels as month", () => {
    expect(formatNormalizedChartLabel("2026-03", "y")).toBe("mar");
    expect(formatNormalizedChartLabel("2026-03", "m")).toBe("mar");
  });

  it("formats arrays consistently", () => {
    expect(
      formatChartLabelsSimple(["2026-03-04", "2026-W09", "2026-03"], "w"),
    ).toEqual(["04", "26-w09", "mar"]);
  });
});
