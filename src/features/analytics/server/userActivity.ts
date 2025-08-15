import { google } from "googleapis";
import type { MultiSeriesCategoriesPayload } from "../types";

function normalizePropertyId(id: string): string {
  const t = id.trim();
  return t.startsWith("properties/") ? t : `properties/${t}`;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function defaultRange(): { start: string; end: string } {
  // ~45 días para ver bien las curvas
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 44);
  return { start: toISO(start), end: toISO(end) };
}

// 20240811 -> "11 ago"
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

export async function buildUserActivityPayload(params?: {
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
}): Promise<MultiSeriesCategoriesPayload> {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !propertyId) {
    throw new Error("Faltan credenciales o Property ID de Google Analytics");
  }

  const range =
    params?.start && params?.end
      ? { start: params.start, end: params.end }
      : defaultRange();

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const resp = await analyticsData.properties.runReport({
    property: normalizePropertyId(propertyId),
    requestBody: {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      // Métricas de actividad: 1, 7 y 28 días.
      metrics: [
        { name: "active28DayUsers" }, // "30 días" en UI
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
  const s7 = rows.map((r) => Number(r.metricValues?.[1]?.value ?? 0));
  const s1 = rows.map((r) => Number(r.metricValues?.[2]?.value ?? 0));

  return {
    categories,
    series: [
      { name: "30 días", data: s30 },
      { name: "7 días", data: s7 },
      { name: "1 día", data: s1 },
    ],
  };
}
