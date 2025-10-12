import { expect } from "vitest";

// Custom matcher for testing granularity ranges
expect.extend({
  toBeValidGranularityRange(
    received: { startDate: string; endDate: string },
    granularity: string
  ) {
    const { startDate, endDate } = received;

    let isValid = false;
    let message = "";

    switch (granularity) {
      case "d":
        // Daily format: YYYYMMDD
        isValid = /^\d{8}$/.test(startDate) && /^\d{8}$/.test(endDate);
        message = `Expected dates to be in YYYYMMDD format for daily granularity`;
        break;
      case "w":
        // Weekly format: YYYY/WW
        isValid =
          /^\d{4}\/\d{2}$/.test(startDate) && /^\d{4}\/\d{2}$/.test(endDate);
        message = `Expected dates to be in YYYY/WW format for weekly granularity`;
        break;
      case "m":
        // Monthly format: YYYY/MM
        isValid =
          /^\d{4}\/\d{2}$/.test(startDate) && /^\d{4}\/\d{2}$/.test(endDate);
        message = `Expected dates to be in YYYY/MM format for monthly granularity`;
        break;
      case "y":
        // Yearly format: YYYY
        isValid = /^\d{4}$/.test(startDate) && /^\d{4}$/.test(endDate);
        message = `Expected dates to be in YYYY format for yearly granularity`;
        break;
      default:
        isValid = false;
        message = `Unknown granularity: ${granularity}`;
    }

    return {
      pass: isValid,
      message: () => message,
    };
  },

  toHaveAnalyticsStructure(received: any) {
    const hasCode = typeof received.code === "number";
    const hasOutput = received.output && typeof received.output === "object";

    const isValid = hasCode && hasOutput;

    return {
      pass: isValid,
      message: () =>
        `Expected object to have analytics API structure with 'code' and 'output' properties`,
    };
  },

  toBeProcessedCategory(received: any) {
    const hasId = typeof received.id === "string";
    const hasLabel = typeof received.label === "string";
    const hasValue = typeof received.value === "number";
    const hasIconSrc = typeof received.iconSrc === "string";

    const isValid = hasId && hasLabel && hasValue && hasIconSrc;

    return {
      pass: isValid,
      message: () =>
        `Expected object to be a processed category with id, label, value, and iconSrc properties`,
    };
  },
});

// Type declarations for custom matchers
declare module "vitest" {
  interface Assertion<T = any> {
    toBeValidGranularityRange(granularity: string): T;
    toHaveAnalyticsStructure(): T;
    toBeProcessedCategory(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidGranularityRange(granularity: string): any;
    toHaveAnalyticsStructure(): any;
    toBeProcessedCategory(): any;
  }
}
