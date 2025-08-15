import { google } from "googleapis";
import type { CountriesPayload, CountryRow } from "../types";

type GaRow = {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
};

function isGaRowArray(x: unknown): x is GaRow[] {
  return Array.isArray(x);
}

function normalizeProperty(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}

export async function buildCountriesPayload(params: {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  limit?: number; // top N (GA exige string)
}): Promise<CountriesPayload> {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const rawPropertyId = process.env.GA_PROPERTY_ID || "";

  if (!clientEmail || !privateKey || !rawPropertyId) {
    throw new Error("Faltan credenciales o Property ID");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const ga = await analyticsData.properties.runReport({
    property: normalizeProperty(rawPropertyId),
    requestBody: {
      dateRanges: [{ startDate: params.start, endDate: params.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "country" }, { name: "countryId" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: String(params.limit ?? 50), // GA espera string
    },
  });

  const rowsRaw = ga.data?.rows ?? [];
  const rowsBase: CountryRow[] = isGaRowArray(rowsRaw)
    ? rowsRaw.map((r) => {
        const country = r.dimensionValues?.[0]?.value ?? "";
        const code = (r.dimensionValues?.[1]?.value ?? "").toUpperCase();
        const customers = Number(r.metricValues?.[0]?.value ?? 0);
        return { country, code, customers, pct: 0 };
      })
    : [];

  const total = rowsBase.reduce((acc, x) => acc + x.customers, 0);
  const rows: CountryRow[] = rowsBase.map((x) => ({
    ...x,
    pct: total ? Math.round((x.customers / total) * 100) : 0,
  }));

  return { total, rows };
}
