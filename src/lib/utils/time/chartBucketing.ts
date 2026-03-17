import type { SeriesPoint } from "@/lib/types";
import { formatNormalizedChartLabel } from "@/lib/utils/charts/labelFormatting";
import { addDaysUTC, parseISO, toISO } from "./datetime";

export type ChartBucketGranularity = "d" | "w" | "m";

export type ChartBucket = {
  key: string;
  label: string;
  start: string;
  end: string;
};

export type ChartBucketPlan = {
  bucketGranularity: ChartBucketGranularity;
  durationDays: number;
  buckets: ChartBucket[];
  bucketKeys: string[];
  bucketLabels: string[];
  toBucketKey: (isoDate: string) => string;
  toBucketLabel: (bucketKey: string) => string;
};

export function calculateInclusiveDurationDays(
  startISO: string,
  endISO: string,
): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function determineChartBucketGranularity(
  durationDays: number,
): ChartBucketGranularity {
  if (durationDays <= 30) {
    return "d";
  }

  if (durationDays <= 60) {
    return "w";
  }

  return "m";
}

function getIsoWeekInfo(isoDate: string): {
  weekYear: number;
  weekNumber: number;
} {
  const date = parseISO(isoDate);
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const weekYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return { weekYear, weekNumber };
}

function formatDailyBucketLabel(isoDate: string): string {
  return formatNormalizedChartLabel(isoDate, "d");
}

function formatWeeklyBucketLabel(isoDate: string): string {
  const { weekYear, weekNumber } = getIsoWeekInfo(isoDate);
  return formatNormalizedChartLabel(
    `${weekYear}-W${String(weekNumber).padStart(2, "0")}`,
    "w",
  );
}

function formatMonthlyBucketLabel(isoDate: string): string {
  return formatNormalizedChartLabel(isoDate.slice(0, 7), "y");
}

function buildDailyBuckets(startISO: string, endISO: string): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  let cursor = parseISO(startISO);
  const end = parseISO(endISO);

  while (cursor <= end) {
    const iso = toISO(cursor);
    buckets.push({
      key: iso,
      label: formatDailyBucketLabel(iso),
      start: iso,
      end: iso,
    });
    cursor = addDaysUTC(cursor, 1);
  }

  return buckets;
}

function buildWindowBuckets(
  startISO: string,
  endISO: string,
  windowSizeDays: number,
  labelFormatter: (bucketStartIso: string) => string,
): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  const end = parseISO(endISO);
  let cursor = parseISO(startISO);

  while (cursor <= end) {
    const bucketStart = toISO(cursor);
    const rawEnd = addDaysUTC(cursor, windowSizeDays - 1);
    const bucketEnd = rawEnd <= end ? toISO(rawEnd) : endISO;

    buckets.push({
      key: bucketStart,
      label: labelFormatter(bucketStart),
      start: bucketStart,
      end: bucketEnd,
    });

    cursor = addDaysUTC(cursor, windowSizeDays);
  }

  return buckets;
}

function buildMonthlyBuckets(startISO: string, endISO: string): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();

  while (
    year < end.getUTCFullYear() ||
    (year === end.getUTCFullYear() && month <= end.getUTCMonth())
  ) {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    buckets.push({
      key: monthKey,
      label: formatMonthlyBucketLabel(monthKey),
      start: monthKey,
      end: monthKey,
    });

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return buckets;
}

export function buildChartBucketPlan(
  startISO?: string | null,
  endISO?: string | null,
): ChartBucketPlan {
  if (!startISO || !endISO) {
    return {
      bucketGranularity: "d",
      durationDays: 0,
      buckets: [],
      bucketKeys: [],
      bucketLabels: [],
      toBucketKey: (isoDate: string) => isoDate,
      toBucketLabel: (bucketKey: string) => bucketKey,
    };
  }

  const durationDays = calculateInclusiveDurationDays(startISO, endISO);
  const bucketGranularity = determineChartBucketGranularity(durationDays);

  const buckets =
    bucketGranularity === "d"
      ? buildDailyBuckets(startISO, endISO)
      : bucketGranularity === "w"
        ? buildWindowBuckets(startISO, endISO, 7, formatWeeklyBucketLabel)
        : buildMonthlyBuckets(startISO, endISO);

  const bucketKeys = buckets.map((bucket) => bucket.key);
  const labelMap = new Map(buckets.map((bucket) => [bucket.key, bucket.label]));
  const start = parseISO(startISO);

  const toBucketKey = (isoDate: string) => {
    if (buckets.length === 0) {
      return isoDate;
    }

    if (bucketGranularity === "d") {
      return isoDate;
    }

    if (bucketGranularity === "m") {
      const monthKey = isoDate.slice(0, 7);
      if (labelMap.has(monthKey)) {
        return monthKey;
      }

      return buckets[buckets.length - 1]?.key ?? monthKey;
    }

    const current = parseISO(isoDate);
    const diffDays = Math.floor(
      (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const normalizedDiff = Math.max(diffDays, 0);
    const bucketSize = bucketGranularity === "w" ? 7 : 30;
    const bucketIndex = Math.min(
      Math.floor(normalizedDiff / bucketSize),
      buckets.length - 1,
    );

    return buckets[bucketIndex]?.key ?? buckets[buckets.length - 1].key;
  };

  return {
    bucketGranularity,
    durationDays,
    buckets,
    bucketKeys,
    bucketLabels: buckets.map((bucket) => bucket.label),
    toBucketKey,
    toBucketLabel: (bucketKey: string) => labelMap.get(bucketKey) ?? bucketKey,
  };
}

export function bucketSeriesPoints(
  points: SeriesPoint[],
  plan: ChartBucketPlan,
): SeriesPoint[] {
  if (plan.buckets.length === 0) {
    return points;
  }

  const valuesByBucket = new Map<string, number>();

  for (const point of points) {
    const bucketKey = plan.toBucketKey(point.label);
    valuesByBucket.set(
      bucketKey,
      (valuesByBucket.get(bucketKey) ?? 0) + point.value,
    );
  }

  return plan.buckets.map((bucket) => ({
    label: bucket.label,
    value: valuesByBucket.get(bucket.key) ?? 0,
  }));
}
