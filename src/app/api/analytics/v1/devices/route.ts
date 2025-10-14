import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/analytics/ga";
import { deriveRangeEndingYesterday } from "@/lib/utils/time/datetime";
import type { analyticsdata_v1beta } from "googleapis";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DonutItem = { label: string; value: number };

/**
 * GET /api/analytics/v1/devices
 * Retorna usuarios agrupados por tipo de dispositivo (desktop, mobile, tablet)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const start = sp.get("start") || undefined;
    const end = sp.get("end") || undefined;
    const g = (sp.get("granularity") || "d") as Granularity;

    // Calcular rango (igual que el endpoint de gender)
    const range =
      start && end
        ? { start, end }
        : (() => {
            const r = deriveRangeEndingYesterday(g);
            return r;
          })();

    // Autenticación y property ID
    const auth = await getAuth();
    const propId = resolvePropertyId();
    const property = normalizePropertyId(propId);

    // Inicializar cliente de Google Analytics
    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth,
    });

    // Query a GA4 para obtener datos de dispositivos
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      keepEmptyRows: false,
      limit: "10",
    };

    const resp = await analyticsData.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    const items: DonutItem[] = rows.map((r) => {
      const label = String(r.dimensionValues?.[0]?.value ?? "unknown");
      const value = Number(r.metricValues?.[0]?.value ?? 0) || 0;
      return { label, value };
    });

    // Filtrar items con valor 0 y ordenar por valor descendente
    const filteredItems = items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({ items: filteredItems });
  } catch (error) {
    console.error("❌ Error en /api/analytics/v1/devices:", error);
    return NextResponse.json(
      { error: "Error obteniendo datos de dispositivos" },
      { status: 500 }
    );
  }
}
