import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { DonutDatum, Granularity } from "@/lib/types";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import { deriveAutoRangeForGranularity, parseISO, toISO } from "@/lib/utils/datetime";

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
  // fallback si Google añadiera categorías nuevas
  return v;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const gParam = (searchParams.get("granularity") || "d") as Granularity;

    const range = start && end
      ? { start, end }
      : (() => {
          const r = deriveAutoRangeForGranularity(gParam);
          return { start: r.startTime, end: r.endTime };
        })();

    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      // userGender + date para filtrar con precisión dentro del rango
      dimensions: [{ name: "userGender" }, { name: "date" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analyticsData.properties.runReport({ property, requestBody: request });
    const rows = resp.data.rows ?? [];

    const startDate = parseISO(range.start);
    const endDate = parseISO(range.end);

    const acc: Record<string, number> = {};
    for (const r of rows) {
      const rawGender = String(r.dimensionValues?.[0]?.value ?? "unknown");
      const d = String(r.dimensionValues?.[1]?.value ?? "");
      if (d.length !== 8) continue;
      const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      const asDate = parseISO(iso);
      if (asDate < startDate || asDate > endDate) continue;

      const v = Number(r.metricValues?.[0]?.value ?? 0);
      const label = toSpanishGenderLabel(rawGender);
      acc[label] = (acc[label] ?? 0) + v;
    }

    const items: DonutDatum[] = Object.entries(acc)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const payload: GenderPayload = {
      range: { start: toISO(startDate), end: toISO(endDate) },
      property,
      items,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
