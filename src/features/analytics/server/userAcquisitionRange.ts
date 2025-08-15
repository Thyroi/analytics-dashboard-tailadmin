import { google } from "googleapis";
import type { AcquisitionRangePayload, ChartSeries } from "../types";

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

// 20240811 -> "11 ago"
function formatDateLabel(rawDate: string): string {
  if (rawDate.length !== 8) return rawDate;
  const y = Number(rawDate.slice(0, 4));
  const m = Number(rawDate.slice(4, 6)) - 1;
  const d = Number(rawDate.slice(6, 8));
  const date = new Date(y, m, d);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export async function buildUserAcquisitionRangePayload(
  start: string,
  end: string
): Promise<AcquisitionRangePayload> {
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
      dimensions: [{ name: "date" }, { name: "firstUserDefaultChannelGroup" }],
      orderBys: [
        { dimension: { dimensionName: "date" } },
        { dimension: { dimensionName: "firstUserDefaultChannelGroup" } },
      ],
    },
  });

  const rows: GaRow[] = Array.isArray(response.data.rows)
    ? (response.data.rows as GaRow[])
    : [];

  const allDatesISO = enumerateDays(start, end);
  const dateToChannelMap = new Map<string, Map<string, number>>();
  const channelsSet = new Set<string>();

  for (const r of rows) {
    const rawDate = r.dimensionValues?.[0]?.value ?? "";
    const channel = r.dimensionValues?.[1]?.value ?? "Other";
    const metric = Number(r.metricValues?.[0]?.value ?? 0);

    if (rawDate.length !== 8) continue;
    const iso = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(
      6,
      8
    )}`;

    const inner = dateToChannelMap.get(iso) ?? new Map<string, number>();
    inner.set(channel, metric);
    dateToChannelMap.set(iso, inner);
    channelsSet.add(channel);
  }

  const preferredOrder = [
    "Direct",
    "Referral",
    "Organic Search",
    "Organic Social",
    "Paid Search",
    "Email",
    "Display",
    "Organic Video",
    "Unassigned",
    "Other",
  ] as const;

  const channels = Array.from(channelsSet).sort((a, b) => {
    const ia = preferredOrder.indexOf(a as (typeof preferredOrder)[number]);
    const ib = preferredOrder.indexOf(b as (typeof preferredOrder)[number]);
    return (
      (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) -
      (ib === -1 ? Number.MAX_SAFE_INTEGER : ib)
    );
  });

  const categoriesISO = allDatesISO;
  const categoriesLabels = allDatesISO.map((iso) =>
    formatDateLabel(iso.replaceAll("-", ""))
  );

  const series: ChartSeries[] = channels.map((ch) => ({
    name: ch || "Other",
    data: categoriesISO.map((iso) => dateToChannelMap.get(iso)?.get(ch) ?? 0),
  }));

  const totalSeries: ChartSeries = {
    name: "Total",
    data: categoriesISO.map((iso) => {
      const map = dateToChannelMap.get(iso);
      let sum = 0;
      if (map) for (const v of map.values()) sum += v;
      return sum;
    }),
  };

  return {
    categoriesISO,
    categoriesLabels,
    channels,
    series,
    totalSeries,
  };
}
