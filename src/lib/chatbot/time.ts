// src/lib/analytics/time.ts
export type Granularity = "day" | "week" | "month";
export type DailyDatum = { date: string; value: number };
export type Range = { start: string; end: string };
export type Bucket = { key: string; start: string; end: string; value: number };

// ===== fechas/helpers =====
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const parseYMD = (s: string) => new Date(`${s}T00:00:00`); // local
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const isoWeek = (d0: Date) => {
  const d = new Date(Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

// ===== normalización =====
export const sortDaily = (data: DailyDatum[]) =>
  [...data].sort((a, b) => (a.date < b.date ? -1 : 1));

export const inferRangeFromDaily = (data: DailyDatum[]): Range => {
  if (!data.length) {
    const today = ymd(new Date());
    return { start: today, end: today };
  }
  const sorted = sortDaily(data);
  return { start: sorted[0].date, end: sorted[sorted.length - 1].date };
};

export const filterByRange = (data: DailyDatum[], range: Range) => {
  const s = parseYMD(range.start);
  const e = parseYMD(range.end);
  return data.filter((d) => {
    const dd = parseYMD(d.date);
    return dd >= s && dd <= e;
  });
};

// ===== bucketing =====
export const bucketize = (
  data: DailyDatum[],
  granularity: Granularity,
  range?: Range
): Bucket[] => {
  const base = range ? filterByRange(sortDaily(data), range) : sortDaily(data);

  if (granularity === "day") {
    return base.map((d) => ({ key: d.date, start: d.date, end: d.date, value: d.value }));
  }

  const sums = new Map<string, number>();
  const spans = new Map<string, { s: string; e: string }>();

  for (const d of base) {
    const dd = parseYMD(d.date);
    const k = granularity === "week" ? isoWeek(dd) : monthKey(dd);
    sums.set(k, (sums.get(k) ?? 0) + d.value);
    const se = spans.get(k);
    if (!se) spans.set(k, { s: d.date, e: d.date });
    else spans.set(k, { s: se.s, e: d.date });
  }

  return [...sums.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => {
      const se = spans.get(k)!;
      return { key: k, start: se.s, end: se.e, value: v };
    });
};

// ===== KPIs & comparación =====
export const computeKpis = (buckets: Bucket[]) => {
  const total = buckets.reduce((a, b) => a + b.value, 0);
  const avg = total / (buckets.length || 1);
  const peak =
    buckets.reduce((m, b) => (b.value > m.value ? b : m), {
      key: "-",
      start: "-",
      end: "-",
      value: 0,
    } as Bucket) || null;
  return { total, avg, peak };
};

export const comparePrevious = (
  buckets: Bucket[],
  granularity: Granularity,
  allDataSorted: DailyDatum[]
): { pct: number; prevAvg: number } | null => {
  if (!buckets.length || !allDataSorted.length) return null;

  // span aproximado en días
  const days =
    granularity === "day"
      ? buckets.length
      : granularity === "week"
      ? buckets.length * 7
      : buckets.length * 30;

  const first = parseYMD(buckets[0].start);
  const prevStart = addDays(first, -days);
  const prevEnd = addDays(first, -1);

  const prev = allDataSorted.filter((d) => {
    const dd = parseYMD(d.date);
    return dd >= prevStart && dd <= prevEnd;
  });

  if (!prev.length) return null;

  const prevBuckets = bucketize(
    prev,
    granularity,
    { start: ymd(prevStart), end: ymd(prevEnd) }
  );
  if (!prevBuckets.length) return null;

  const prevAvg = computeKpis(prevBuckets).avg;
  const currAvg = computeKpis(buckets).avg;
  if (prevAvg === 0) return null;

  const pct = ((currAvg - prevAvg) / prevAvg) * 100;
  return { pct, prevAvg };
};
