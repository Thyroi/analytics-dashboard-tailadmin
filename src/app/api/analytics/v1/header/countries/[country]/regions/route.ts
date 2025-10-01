import { deriveAutoRangeForGranularity } from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

export type RegionRow = {
  region: string;
  code?: string | null;
  customers: number;
  pct: number; // % del total del país
};

export type RegionsPayload = {
  range: { start: string; end: string };
  property: string;
  country: { code: string; name?: string | null };
  total: number;
  rows: RegionRow[];
};

export async function GET(
  req: Request,
  { params }: { params: { country: string } }
) {
  try {
    const country = (params.country || "").toUpperCase();
    if (!country || country.length !== 2) {
      return NextResponse.json(
        { error: "country (ISO-2) es requerido" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const granularity = (searchParams.get("granularity") || "d") as
      | "d"
      | "w"
      | "m"
      | "y";
    const limitParam = Number(searchParams.get("limit") || "100");

    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveAutoRangeForGranularity(granularity);
            return { start: r.startTime, end: r.endTime };
          })();

    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // 1) Total país
    const totalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "countryId" }],
      dimensionFilter: {
        filter: { fieldName: "countryId", stringFilter: { value: country } },
      },
      keepEmptyRows: false,
      limit: "1",
    };
    const totalResp = await analytics.properties.runReport({
      property,
      requestBody: totalReq,
    });
    const total =
      Number(totalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) || 0;

    // 2) Regiones dentro del país
    const regionsReq: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "countryId" }, { name: "region" }],
      dimensionFilter: {
        filter: { fieldName: "countryId", stringFilter: { value: country } },
      },
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: String(Math.max(1, Math.min(5000, limitParam))),
    };
    const regionsResp = await analytics.properties.runReport({
      property,
      requestBody: regionsReq,
    });

    const rows = regionsResp.data.rows ?? [];
    const parsed: RegionRow[] = rows.map((r) => {
      const region = String(r.dimensionValues?.[1]?.value ?? "Unknown");
      const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      return {
        region,
        code: null,
        customers,
        pct: total > 0 ? Math.round((customers / total) * 100) : 0,
      };
    });

    const payload: RegionsPayload = {
      range,
      property,
      country: { code: country, name: null },
      total,
      rows: parsed,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
