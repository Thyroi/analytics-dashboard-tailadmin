import { google } from "googleapis";
import type { MultiSeriesCategoriesPayload } from "../types";

// Normaliza el property para evitar "properties/properties/<id>"
function normalizePropertyId(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}

export async function buildMonthlyVisitsPayload(): Promise<MultiSeriesCategoriesPayload> {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const propertyId = process.env.GA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !propertyId) {
    throw new Error("Faltan credenciales o Property ID de Google Analytics");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const resp = await analyticsData.properties.runReport({
    property: normalizePropertyId(propertyId),
    requestBody: {
      dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "yearMonth" }],
      orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
    },
  });

  const rows = resp.data.rows ?? [];

  // yearMonth -> "ene", "feb", ...
  const categories = rows.map((row) => {
    const ym = row.dimensionValues?.[0]?.value ?? "";
    const year = ym.substring(0, 4);
    const month = ym.substring(4, 6);
    const date = new Date(`${year}-${month}-01`);
    return date.toLocaleString("es-ES", { month: "short" });
  });

  const values = rows.map((row) => Number(row.metricValues?.[0]?.value ?? 0));

  return {
    categories,
    series: [{ name: "Usuarios activos", data: values }],
  };
}
