import { google } from "googleapis";
import type { SingleMetricRangePayload } from "../types";

type GaValue = { value?: string };
type GaRow = { dimensionValues?: GaValue[]; metricValues?: GaValue[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function enumerateDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function labelFromISO(iso: string): string {
  // "YYYY-MM-DD" -> "dd MMM" (es-ES)
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export async function buildMonthlyRangePayload(
  start: string,
  end: string
): Promise<SingleMetricRangePayload> {
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    throw new Error("Fechas inválidas: usa YYYY-MM-DD");
  }

  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const rawPropertyId = process.env.GA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !rawPropertyId) {
    throw new Error("Faltan credenciales o Property ID de Google Analytics");
  }

  const property = rawPropertyId.startsWith("properties/")
    ? rawPropertyId
    : `properties/${rawPropertyId}`;

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const response = await analyticsData.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "date" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  const rows: GaRow[] = Array.isArray(response.data.rows)
    ? (response.data.rows as GaRow[])
    : [];

  // Mapa YYYY-MM-DD -> valor
  const byDate = new Map<string, number>();
  for (const r of rows) {
    const raw = r.dimensionValues?.[0]?.value ?? ""; // YYYYMMDD
    if (raw.length !== 8) continue;
    const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    const n = Number(r.metricValues?.[0]?.value ?? 0);
    byDate.set(iso, n);
  }

  const categoriesISO = enumerateDays(start, end);
  const categoriesLabels = categoriesISO.map(labelFromISO);
  const data = categoriesISO.map((iso) => byDate.get(iso) ?? 0);

  return {
    categoriesISO,
    categoriesLabels,
    series: { name: "Visitas", data },
  };
}
