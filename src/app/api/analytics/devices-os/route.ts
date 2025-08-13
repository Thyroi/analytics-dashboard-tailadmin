// src/app/api/analytics/devices-os/route.ts
import { google, analyticsdata_v1beta } from "googleapis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type ApiPayload = { labels: string[]; values: number[] };

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Normaliza el property para evitar "properties/properties/<id>"
function normalizePropertyId(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}

function defaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: toISODate(start), end: toISODate(end) };
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
    const def = defaultRange();
    const start = searchParams.get("start") ?? def.start;
    const end = searchParams.get("end") ?? def.end;

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const requestBody: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: start, endDate: end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "operatingSystem" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: "50",
    };

    const params: analyticsdata_v1beta.Params$Resource$Properties$Runreport = {
      property: normalizePropertyId(propertyId),
      requestBody,
    };

    const resp = await analyticsData.properties.runReport(params);
    const rows = resp.data.rows ?? [];

    const slices = rows.map((r) => {
      const raw = r.dimensionValues?.[0]?.value ?? "Other";
      const label = raw === "(not set)" ? "Other" : raw;
      const value = Number(r.metricValues?.[0]?.value ?? 0);
      return { label, value };
    });

    // Top 6 + "Other"
    slices.sort((a, b) => b.value - a.value);
    const top = slices.slice(0, 6);
    const restSum = slices.slice(6).reduce((acc, s) => acc + s.value, 0);
    const finalSlices = restSum > 0 ? [...top, { label: "Other", value: restSum }] : top;

    const payload: ApiPayload = {
      labels: finalSlices.map((s) => s.label),
      values: finalSlices.map((s) => s.value),
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al conectar con Google Analytics";
    console.error("GA4 OS donut error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
