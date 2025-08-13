import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

type GaValue = { value?: string };
type GaRow = { dimensionValues?: GaValue[]; metricValues?: GaValue[] };

type Series = { name: string; data: number[] };
type ApiResponse = {
  categoriesISO: string[];
  categoriesLabels: string[];
  channels: string[];
  series: Series[];
  totalSeries: Series;
};

// YYYY-MM-DD inclusivo
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
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(date);
}

export async function GET(req: NextRequest) {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!clientEmail || !privateKey || !propertyId) {
      return NextResponse.json(
        { error: "Faltan credenciales o Property ID de Google Analytics" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes especificar start y end en formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const response = await analyticsData.properties.runReport({
      property: propertyId,
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

    const rows: GaRow[] = Array.isArray(response.data.rows) ? (response.data.rows as GaRow[]) : [];

    const allDatesISO = enumerateDays(start, end);
    const dateToChannelMap = new Map<string, Map<string, number>>();
    const channelsSet = new Set<string>();

    for (const r of rows) {
      const rawDate = r.dimensionValues?.[0]?.value ?? "";
      const channel = r.dimensionValues?.[1]?.value ?? "Other";
      const metric = Number(r.metricValues?.[0]?.value ?? 0);

      if (rawDate.length !== 8) continue;
      const iso = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;

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
      return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
    });

    const categoriesISO = allDatesISO;
    const categoriesLabels = allDatesISO.map((iso) => formatDateLabel(iso.replaceAll("-", "")));

    const series: Series[] = channels.map((ch) => ({
      name: ch || "Other",
      data: categoriesISO.map((iso) => dateToChannelMap.get(iso)?.get(ch) ?? 0),
    }));

    const totalSeries: Series = {
      name: "Total",
      data: categoriesISO.map((iso) => {
        const map = dateToChannelMap.get(iso);
        let sum = 0;
        if (map) for (const v of map.values()) sum += v;
        return sum;
      }),
    };

    const payload: ApiResponse = {
      categoriesISO,
      categoriesLabels,
      channels,
      series,
      totalSeries,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al conectar con Google Analytics";
    console.error("Error detallado GA4 (acquisition-range):", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
