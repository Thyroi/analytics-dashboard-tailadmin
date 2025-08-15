import { google } from "googleapis";
import type { KpiPayload, KpiTotals } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysDiffInclusive(startISO: string, endISO: string): number {
  const s = new Date(`${startISO}T00:00:00`);
  const e = new Date(`${endISO}T00:00:00`);
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
}
function shiftDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return (curr - prev) / prev;
}

async function runTotals(
  analyticsData: ReturnType<typeof google.analyticsdata>,
  propertyPath: string,
  start: string,
  end: string
): Promise<KpiTotals> {
  const response = await analyticsData.properties.runReport({
    property: propertyPath,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      metrics: [
        { name: "activeUsers" },
        { name: "engagedSessions" },
        { name: "eventCount" },
      ],
    },
  });

  const row = Array.isArray(response.data.rows)
    ? response.data.rows[0]
    : undefined;
  const m = row?.metricValues ?? [];
  const toNum = (i: number) => Number(m[i]?.value ?? 0);

  return {
    activeUsers: toNum(0),
    engagedSessions: toNum(1),
    eventCount: toNum(2),
  };
}

export async function buildKpisPayload(
  start: string,
  end: string
): Promise<KpiPayload> {
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    throw new Error("Fechas inválidas: usa YYYY-MM-DD");
  }

  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const rawPropertyId = process.env.GA_PROPERTY_ID;
  if (!clientEmail || !privateKey || !rawPropertyId) {
    throw new Error("Faltan credenciales o Property ID de Google Analytics");
  }
  const property = rawPropertyId.startsWith("properties/")
    ? rawPropertyId
    : `properties/${rawPropertyId}`;

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analyticsData = google.analyticsdata({ version: "v1beta", auth });

  const len = daysDiffInclusive(start, end);
  const prevEnd = shiftDays(start, -1);
  const prevStart = shiftDays(prevEnd, -(len - 1));

  const [current, previous] = await Promise.all([
    runTotals(analyticsData, property, start, end),
    runTotals(analyticsData, property, prevStart, prevEnd),
  ]);

  return {
    current,
    previous,
    deltaPct: {
      activeUsers: pctChange(current.activeUsers, previous.activeUsers),
      engagedSessions: pctChange(
        current.engagedSessions,
        previous.engagedSessions
      ),
      eventCount: pctChange(current.eventCount, previous.eventCount),
    },
  };
}
