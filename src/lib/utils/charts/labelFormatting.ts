// Utility function to format chart labels based on granularity
import { formatDateTick } from "@/lib/analytics/format";

const SPANISH_MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatMonthLabel(month: string): string {
  return SPANISH_MONTHS_SHORT[Number(month) - 1] ?? month;
}

function formatWeekLabel(year: string, week: string): string {
  return `${year.slice(-2)}-w${week.padStart(2, "0")}`;
}

export function formatNormalizedChartLabel(
  value: string,
  granularity: "d" | "w" | "m" | "y",
): string {
  const raw = String(value ?? "").trim();
  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
  const isoWeek = raw.match(/^(\d{4})-[Ww](\d{1,2})$/);

  if (isoWeek) {
    return formatWeekLabel(isoWeek[1], isoWeek[2]);
  }

  if (granularity === "y") {
    if (isoMonth) {
      return formatMonthLabel(isoMonth[2]);
    }

    if (isoDay) {
      return formatMonthLabel(isoDay[2]);
    }
  }

  if (isoMonth) {
    return formatMonthLabel(isoMonth[2]);
  }

  if (isoDay) {
    return isoDay[3];
  }

  return raw;
}

/**
 * Formats chart labels based on granularity to avoid overcrowded labels
 *
 * @param labels - Array of date labels from the API
 * @param granularity - The granularity (d, w, m, y)
 * @returns Formatted labels array
 */
export function formatChartLabels(
  labels: string[],
  granularity: "d" | "w" | "m" | "y",
): string[] {
  if (!labels || labels.length === 0) {
    return [];
  }

  return labels.map((label) => {
    try {
      const normalized = formatNormalizedChartLabel(String(label), granularity);
      if (normalized !== String(label)) {
        return normalized;
      }

      const formattedDate = formatDateTick(String(label), granularity);
      return formatNormalizedChartLabel(formattedDate, granularity);
    } catch {
      return String(label);
    }
  });
}

/**
 * Alternative simpler version that just extracts day/month based on granularity
 */
export function formatChartLabelsSimple(
  labels: string[],
  granularity: "d" | "w" | "m" | "y",
): string[] {
  if (!labels || labels.length === 0) {
    return [];
  }

  return labels.map((label) =>
    formatNormalizedChartLabel(String(label), granularity),
  );
}
