// src/app/api/analytics/v1/series/user-acquisition-range/route.ts
import type { Granularity } from "@/lib/types";
import {
  deriveRangeEndingYesterday,
  parseISO,
  toISO,
  todayUTC,
} from "@/lib/utils/datetime";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { analyticsdata_v1beta, google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SeriesItem = { name: string; data: number[] };
type AcquisitionRangePayload = {
  range: { start: string; end: string };
  property: string;
  categoriesLabels: string[]; // eje X (días o meses según granularidad)
  series: SeriesItem[]; // por canal + "Total"
};

/* =============== utilidades de eje X =============== */

function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  );
  const end = new Date(
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  );
  const out: string[] = [];
  while (cur <= end) {
    out.push(toISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function ymLabel(y: number, mZeroBased: number): string {
  const mm = String(mZeroBased + 1).padStart(2, "0");
  return `${y}-${mm}`;
}
function ymKey(y: number, mZeroBased: number): string {
  const mm = String(mZeroBased + 1).padStart(2, "0");
  return `${y}${mm}`;
}

/** Últimos n meses (incluyendo el mes de `endDate`) */
function listLastNMonths(
  endDate: Date,
  n = 12
): {
  labels: string[]; // ["YYYY-MM", ...]
  keys: string[]; // ["YYYYMM", ...] para mapear contra GA
  indexByKey: Map<string, number>;
} {
  const labels: string[] = [];
  const keys: string[] = [];
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - i, 1));
    labels.push(ymLabel(d.getUTCFullYear(), d.getUTCMonth()));
    keys.push(ymKey(d.getUTCFullYear(), d.getUTCMonth()));
  }
  return { labels, keys, indexByKey: new Map(keys.map((k, i) => [k, i])) };
}

/* ======================== handler ======================== */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const g = (searchParams.get("granularity") || "d") as Granularity;
    const includeTotal = (searchParams.get("includeTotal") ?? "1") !== "0";

    // Rango actual: si no pasan start/end, usar ventana que TERMINA AYER.
    // Para 'd' queremos 7 días terminando ayer (dayAsWeek=true) para tener serie (no un solo punto).
    const range =
      start && end
        ? { start, end }
        : (() => {
            const dayAsWeek = g === "d";
            const r = deriveRangeEndingYesterday(g, todayUTC(), dayAsWeek);
            return { start: r.startTime, end: r.endTime };
          })();

    // Auth + GA4
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // d / w / m => por día ; y => por mes (yearMonth)
    const isYearlyMonthly = g === "y";

    let categoriesLabels: string[];
    let indexBySlot: Map<string, number>;
    let dimensionTime: "date" | "yearMonth";

    if (isYearlyMonthly) {
      const endDate = parseISO(range.end);
      const { labels, keys, indexByKey } = listLastNMonths(endDate, 12);
      categoriesLabels = labels; // ["YYYY-MM", ...]
      indexBySlot = indexByKey; // índices por "YYYYMM"
      dimensionTime = "yearMonth";
    } else {
      categoriesLabels = enumerateDaysUTC(range.start, range.end); // 7, 30 o 365 días
      indexBySlot = new Map(categoriesLabels.map((d, i) => [d, i])); // "YYYY-MM-DD"
      dimensionTime = "date";
    }

    // Consulta: usuarios activos por canal y slot temporal
    const request: analyticsdata_v1beta.Schema$RunReportRequest = {
      dateRanges: [{ startDate: range.start, endDate: range.end }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [
        { name: "firstUserDefaultChannelGroup" },
        { name: dimensionTime },
      ],
      orderBys: [
        { dimension: { dimensionName: dimensionTime } },
        { metric: { metricName: "activeUsers" }, desc: true },
      ],
      keepEmptyRows: false,
      limit: "100000",
    };

    const resp = await analytics.properties.runReport({
      property,
      requestBody: request,
    });

    const rows = resp.data.rows ?? [];

    // Canal -> vector de slots, prellenado con 0s
    const seriesMap = new Map<string, number[]>();
    const totalsByChannel = new Map<string, number>();

    for (const r of rows) {
      const channel = String(r.dimensionValues?.[0]?.value || "Unassigned");
      const slotRaw = String(r.dimensionValues?.[1]?.value || "");
      let key: string | null = null;

      if (dimensionTime === "date") {
        // YYYYMMDD -> YYYY-MM-DD
        if (slotRaw.length === 8) {
          key = `${slotRaw.slice(0, 4)}-${slotRaw.slice(4, 6)}-${slotRaw.slice(
            6,
            8
          )}`;
        }
      } else {
        // yearMonth -> YYYYMM
        if (slotRaw.length === 6) key = slotRaw;
      }

      if (!key) continue;
      const idx = indexBySlot.get(key);
      if (idx === undefined) continue;

      const v = Number(r.metricValues?.[0]?.value || 0);

      if (!seriesMap.has(channel)) {
        seriesMap.set(channel, Array(categoriesLabels.length).fill(0));
      }
      const vec = seriesMap.get(channel)!;
      vec[idx] += v;
      totalsByChannel.set(channel, (totalsByChannel.get(channel) ?? 0) + v);
    }

    // Ordenamos canales por total desc y generamos series
    const channels = [...seriesMap.keys()].sort(
      (a, b) => (totalsByChannel.get(b) ?? 0) - (totalsByChannel.get(a) ?? 0)
    );

    const series: SeriesItem[] = channels.map((name) => ({
      name,
      data: seriesMap.get(name)!,
    }));

    if (includeTotal) {
      const totalData = Array(categoriesLabels.length).fill(0);
      for (const s of series) {
        for (let i = 0; i < categoriesLabels.length; i++) {
          totalData[i] += s.data[i];
        }
      }
      series.unshift({ name: "Total", data: totalData });
    }

    const payload: AcquisitionRangePayload = {
      range: { start: range.start, end: range.end },
      property,
      categoriesLabels,
      series,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
