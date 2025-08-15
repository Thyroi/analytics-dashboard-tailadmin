import { buildDevicesOsPayload } from "@/features/analytics/server/devicesOs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const payload = await buildDevicesOsPayload(start, end);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al conectar con Google Analytics";
    console.error("GA4 OS donut error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
