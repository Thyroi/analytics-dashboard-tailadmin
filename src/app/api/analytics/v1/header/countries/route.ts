import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { deriveRangeEndingYesterday } from "@/lib/utils/time/datetime";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type CountryRow = {
  code: string | null; // ISO-2 o null para Unknown
  country: string;
  customers: number; // activeUsers
  pct: number; // % sobre total global (KPIs)
};

export type CountriesPayload = {
  range: { start: string; end: string };
  property: string;
  total: number; // == KPIs.activeUsers del mismo rango
  rows: CountryRow[];
};

function clampLimit(v: string | null, fallback = 100): number {
  const n = Number(v ?? `${fallback}`);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5000, Math.floor(n)));
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const start = sp.get("start") || undefined;
    const end = sp.get("end") || undefined;
    const granularity = (sp.get("granularity") || "d") as Granularity;
    const limitParam = clampLimit(sp.get("limit"), 100);

    // Ventana terminando AYER (para 'd' es solo AYER)
    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveRangeEndingYesterday(granularity);
            return r;
          })();

    // Auth + GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // 1) TOTAL GLOBAL (para cuadrar con KPIs)
    const totalReq: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      keepEmptyRows: false,
      limit: "1",
    };
    const totalResp = await analytics.properties.runReport({
      property,
      requestBody: totalReq,
    });
    const globalTotal =
      Number(totalResp.data.rows?.[0]?.metricValues?.[0]?.value ?? 0) || 0;

    // 2) Desglose por país (incluye Unknown)
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "country" }, { name: "countryId" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: String(limitParam),
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });
    const rowsRaw = resp.data.rows ?? [];

    const rows = rowsRaw.map((r) => {
      const country = String(r.dimensionValues?.[0]?.value ?? "Unknown");
      const codeRaw = String(r.dimensionValues?.[1]?.value ?? "");
      const code =
        codeRaw && codeRaw.length === 2 ? codeRaw.toUpperCase() : null;
      const customers = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      return { country, code, customers };
    });

    const top: CountryRow[] = rows
      .sort((a, b) => b.customers - a.customers)
      .slice(0, limitParam)
      .map((x) => ({
        country: x.country,
        code: x.code,
        customers: x.customers,
        pct:
          globalTotal > 0 ? Math.round((x.customers / globalTotal) * 100) : 0,
      }));

    const payload: CountriesPayload = {
      range,
      property,
      total: globalTotal,
      rows: top,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
