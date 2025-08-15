import { buildUserAcquisitionRangePayload } from "@/features/analytics/server/userAcquisitionRange";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes especificar start y end en formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const payload = await buildUserAcquisitionRangePayload(start, end);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al conectar con Google Analytics";
    console.error("Error GA4 (user-acquisition-range):", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
