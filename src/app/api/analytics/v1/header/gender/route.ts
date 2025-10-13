// src/app/api/analytics/v1/header/gender/route.ts
import type { DonutDatum, Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import {
  deriveRangeEndingYesterday,
  parseISO,
  toISO,
} from "@/lib/utils/time/datetime";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GenderPayload = {
  range: { start: string; end: string };
  property: string;
  items: DonutDatum[]; // [{ label, value }]
};

function toSpanishGenderLabel(v: string): string {
  const k = v.trim().toLowerCase();
  if (k === "male") return "Hombre";
  if (k === "female") return "Mujer";
  if (k === "unknown") return "Desconocido";
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const start = sp.get("start") || undefined;
    const end = sp.get("end") || undefined;
    const g = (sp.get("granularity") || "d") as Granularity;

    // Ventana por defecto: termina AYER (consistente con KPIs y demás endpoints)
    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveRangeEndingYesterday(g);
            return r;
          })();

    // Auth + GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Agregado por género dentro del rango (sin dimensión "date")
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      dimensions: [{ name: "userGender" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: "1000",
    };

    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    const acc: Record<string, number> = {};
    for (const r of rows) {
      const rawGender = String(r.dimensionValues?.[0]?.value ?? "unknown");
      const value = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      const label = toSpanishGenderLabel(rawGender);
      acc[label] = (acc[label] ?? 0) + value;
    }

    const items: DonutDatum[] = Object.entries(acc)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const payload: GenderPayload = {
      range: {
        start: toISO(parseISO(range.start)),
        end: toISO(parseISO(range.end)),
      },
      property,
      items,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
