import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import { deriveAutoRangeForGranularity } from "@/lib/utils/datetime";

// ── Tipos del payload ──────────────────────────────────────────────────────────
export type CountryRow = {
  code: string;       // ISO-3166 alpha-2 (p.ej. "US")
  country: string;    // nombre legible (p.ej. "United States")
  customers: number;  // activeUsers
  pct: number;        // % del total
};

export type CountriesPayload = {
  range: { start: string; end: string };
  property: string;
  total: number;
  rows: CountryRow[];
};

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const granularity = (searchParams.get("granularity") || "d") as "d" | "w" | "m" | "y";
    const limitParam = Number(searchParams.get("limit") || "100");

    const range = start && end
      ? { start, end }
      : (() => {
          const r = deriveAutoRangeForGranularity(granularity);
          return { start: r.startTime, end: r.endTime };
        })();

    // Auth + GA
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // country (nombre) + countryId (código ISO-2)
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "country" }, { name: "countryId" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: String(Math.max(1, Math.min(5000, limitParam))),
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];
    let total = 0;

    const parsed: CountryRow[] = rows.map((r) => {
      const country = String(r.dimensionValues?.[0]?.value ?? "Unknown");
      const code = String(r.dimensionValues?.[1]?.value ?? "").toUpperCase();
      const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      total += customers;
      return { country, code, customers, pct: 0 };
    });

    // filtra filas sin código (opcional)
    const filtered = parsed.filter((x) => x.code && x.code.length === 2);

    // calcula % y limita si hace falta
    const top = filtered
      .sort((a, b) => b.customers - a.customers)
      .slice(0, limitParam > 0 ? limitParam : 100)
      .map((x) => ({
        ...x,
        pct: total > 0 ? Math.round((x.customers / total) * 100) : 0,
      }));

    const payload: CountriesPayload = {
      range,
      property,
      total,
      rows: top,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
