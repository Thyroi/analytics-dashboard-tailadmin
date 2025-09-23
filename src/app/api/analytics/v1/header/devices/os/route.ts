// app/api/analytics/v1/devices/os/route.ts
import { NextResponse } from "next/server";
import { google, analyticsdata_v1beta } from "googleapis";
import type { DonutDatum, Granularity } from "@/lib/types";
import { getAuth, normalizePropertyId, resolvePropertyId } from "@/lib/utils/ga";
import {
  deriveAutoRangeForGranularity,
  parseISO,
  toISO,
} from "@/lib/utils/datetime";

/** Payload del endpoint */
type DevicesOsPayload = {
  range: { start: string; end: string };
  property: string;
  items: DonutDatum[]; // [{label, value}]
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Permite pasar rango explícito; si no, usa el preset de "d" (últimos 7 días).
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    // Opcional: granularity SOLO para derivar el rango por defecto si no pasan start/end
    const gParam = (searchParams.get("granularity") ||
      "d") as Granularity;

    const range = start && end
      ? { start, end }
      : (() => {
          const r = deriveAutoRangeForGranularity(gParam);
          return { start: r.startTime, end: r.endTime };
        })();

    // Auth + GA
    const auth = getAuth();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Consulta: usuarios por sistema operativo en el rango dado
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "operatingSystem" }, { name: "date" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // Agregamos por SO dentro del rango (por si vinieran fechas sueltas)
    const startDate = parseISO(range.start);
    const endDate = parseISO(range.end);

    const map: Record<string, number> = {};
    for (const r of rows) {
      const os = String(r.dimensionValues?.[0]?.value ?? "Other");
      const d = String(r.dimensionValues?.[1]?.value ?? ""); // YYYYMMDD
      if (d.length !== 8) continue;
      const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      const asDate = parseISO(iso);
      if (asDate < startDate || asDate > endDate) continue;

      const v = Number(r.metricValues?.[0]?.value ?? 0);
      map[os] = (map[os] ?? 0) + v;
    }

    // Normalizamos items (orden desc)
    const items = Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const payload: DevicesOsPayload = {
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
