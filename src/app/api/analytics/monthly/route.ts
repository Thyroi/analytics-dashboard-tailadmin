import { buildMonthlyVisitsPayload } from "@/features/analytics/server/monthlyVisits";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const payload = await buildMonthlyVisitsPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al conectar con Google Analytics";
    console.error("Error GA4 monthly:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
