import { deriveAutoRangeForGranularity } from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

export type CityRow = {
  city: string;
  customers: number;
  pct: number; // % sobre el total de la región
};

export type CitiesPayload = {
  range: { start: string; end: string };
  property: string;
  country: { code: string };
  region: string;
  total: number; // total de la región
  rows: CityRow[];
};

export async function GET(
  req: Request,
  { params }: { params: { country: string; region: string } }
) {
  try {
    const country = (params.country || "").toUpperCase();
    const region = decodeURIComponent(params.region || "");
    if (!country || country.length !== 2 || !region) {
      return NextResponse.json(
        { error: "country (ISO-2) y region son requeridos" },
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

    // 1) Total de la región (para %)
    const regionTotalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "countryId" }, { name: "region" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "countryId",
                stringFilter: { value: country },
              },
            },
            {
              filter: { fieldName: "region", stringFilter: { value: region } },
            },
          ],
        },
      },
      keepEmptyRows: false,
      limit: "1",
    };
    const regionTotalResp = await analytics.properties.runReport({
      property,
      requestBody: regionTotalReq,
    });
    const totalRegion =
      Number(regionTotalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) ||
      0;

    // 2) Ciudades dentro de la región
    const citiesReq: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "countryId" }, { name: "region" }, { name: "city" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "countryId",
                stringFilter: { value: country },
              },
            },
            {
              filter: { fieldName: "region", stringFilter: { value: region } },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: String(Math.max(1, Math.min(5000, limitParam))),
    };
    const citiesResp = await analytics.properties.runReport({
      property,
      requestBody: citiesReq,
    });

    const rows = citiesResp.data.rows ?? [];
    const parsed: CityRow[] = rows.map((r) => {
      const city = String(r.dimensionValues?.[2]?.value ?? "Unknown");
      const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      return {
        city,
        customers,
        pct: totalRegion > 0 ? Math.round((customers / totalRegion) * 100) : 0,
      };
    });

    const payload: CitiesPayload = {
      range,
      property,
      country: { code: country },
      region,
      total: totalRegion,
      rows: parsed,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
