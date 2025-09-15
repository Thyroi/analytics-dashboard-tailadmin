import type { MultiSeriesCategoriesPayload } from "../types";
import {
  defaultRange,
  getAnalyticsDataClient,
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "./_ga";

function formatDateLabel(rawYYYYMMDD: string): string {
  if (rawYYYYMMDD.length !== 8) return rawYYYYMMDD;
  const y = Number(rawYYYYMMDD.slice(0, 4));
  const m = Number(rawYYYYMMDD.slice(4, 6)) - 1;
  const d = Number(rawYYYYMMDD.slice(6, 8));
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m, d));
}

export type UserActivityParams = {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  source?: "wpideanto" | undefined;
};

export async function buildUserActivityPayload(
  params?: UserActivityParams
): Promise<MultiSeriesCategoriesPayload> {
  const range =
    params?.start && params?.end
      ? { start: params.start, end: params.end }
      : defaultRange();

  const auth = getAuth();
  const analyticsData = getAnalyticsDataClient(auth);
  const propertyId = resolvePropertyId(params?.source);

  const resp = await analyticsData.properties.runReport({
    property: normalizePropertyId(propertyId),
    requestBody: {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [
        { name: "active28DayUsers" },
        { name: "active7DayUsers" },
        { name: "active1DayUsers" },
      ],
      dimensions: [{ name: "date" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  const rows = resp.data.rows ?? [];
  const categories = rows.map((r) =>
    formatDateLabel(String(r.dimensionValues?.[0]?.value ?? ""))
  );

  const s30 = rows.map((r) => Number(r.metricValues?.[0]?.value ?? 0));
  const s7  = rows.map((r) => Number(r.metricValues?.[1]?.value ?? 0));
  const s1  = rows.map((r) => Number(r.metricValues?.[2]?.value ?? 0));

  return {
    categories,
    series: [
      { name: "30 días", data: s30 },
      { name: "7 días",  data: s7 },
      { name: "1 día",   data: s1 },
    ],
  };
}
