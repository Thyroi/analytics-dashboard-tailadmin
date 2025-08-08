// /src/app/api/analytics/countries/route.ts
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

type GaRow = {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
};

type CountriesRow = {
  country: string;
  code: string; // ISO-3166-1 alpha-2
  customers: number;
  pct: number;
};

type CountriesResponse = {
  total: number;
  rows: CountriesRow[];
};

function isGaRowArray(x: unknown): x is GaRow[] {
  return Array.isArray(x);
}

export async function GET(req: NextRequest) {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const rawPropertyId = process.env.GA_PROPERTY_ID || "";

    if (!clientEmail || !privateKey || !rawPropertyId) {
      return NextResponse.json(
        { error: "Faltan credenciales o Property ID" },
        { status: 500 }
      );
    }

    // GA exige "properties/{ID}" como string
    const property = rawPropertyId.startsWith("properties/")
      ? rawPropertyId
      : `properties/${rawPropertyId}`;

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limitParam = searchParams.get("limit");
    const limitNum = Number(limitParam ?? 50);
    const limit = String(Number.isFinite(limitNum) ? limitNum : 50); // GA espera string

    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes enviar start y end (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const ga = await analyticsData.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "activeUsers" }],
        dimensions: [{ name: "country" }, { name: "countryId" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit, // 👈 string
      },
    });

    const rowsRaw = ga.data?.rows ?? [];
    const rowsBase: CountriesRow[] = isGaRowArray(rowsRaw)
      ? rowsRaw.map((r) => {
          const country = r.dimensionValues?.[0]?.value ?? "";
          const code = (r.dimensionValues?.[1]?.value ?? "").toUpperCase();
          const customers = Number(r.metricValues?.[0]?.value ?? 0);
          return { country, code, customers, pct: 0 };
        })
      : [];

    const total = rowsBase.reduce((acc, x) => acc + x.customers, 0);
    const rows: CountriesRow[] = rowsBase.map((x) => ({
      ...x,
      pct: total ? Math.round((x.customers / total) * 100) : 0,
    }));

    const payload: CountriesResponse = { total, rows };
    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "GA4 error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
