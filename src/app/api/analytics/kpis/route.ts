import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

type KpiTotals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
};

type KpiPayload = {
  current: KpiTotals;
  previous: KpiTotals;
  deltaPct: {
    activeUsers: number | null;
    engagedSessions: number | null;
    eventCount: number | null;
  };
};

function daysDiffInclusive(startISO: string, endISO: string): number {
  const s = new Date(`${startISO}T00:00:00`);
  const e = new Date(`${endISO}T00:00:00`);
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / 86400000) + 1;
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
  propertyId: string,
  start: string,
  end: string
): Promise<KpiTotals> {
  const response = await analyticsData.properties.runReport({
    property: propertyId,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      // Métricas agregadas (sin dimensiones) para sumar en el rango
      metrics: [
        { name: "activeUsers" },
        { name: "engagedSessions" },
        { name: "eventCount" },
      ],
    },
  });

  const row = Array.isArray(response.data.rows) ? response.data.rows[0] : undefined;
  const m = row?.metricValues ?? [];

  const toNum = (i: number): number => Number(m[i]?.value ?? 0);
  return {
    activeUsers: toNum(0),
    engagedSessions: toNum(1),
    eventCount: toNum(2),
  };
}

export async function GET(req: NextRequest) {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!clientEmail || !privateKey || !propertyId) {
      return NextResponse.json(
        { error: "Faltan credenciales o Property ID de Google Analytics" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes especificar start y end en formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    // Periodo anterior del mismo largo
    const len = daysDiffInclusive(start, end);
    const prevEnd = shiftDays(start, -1);
    const prevStart = shiftDays(prevEnd, -(len - 1));

    const [current, previous] = await Promise.all([
      runTotals(analyticsData, propertyId, start, end),
      runTotals(analyticsData, propertyId, prevStart, prevEnd),
    ]);

    const payload: KpiPayload = {
      current,
      previous,
      deltaPct: {
        activeUsers: pctChange(current.activeUsers, previous.activeUsers),
        engagedSessions: pctChange(current.engagedSessions, previous.engagedSessions),
        eventCount: pctChange(current.eventCount, previous.eventCount),
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al conectar con Google Analytics";
    console.error("Error GA4 KPIs:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
