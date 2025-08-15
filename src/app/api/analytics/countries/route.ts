import { buildCountriesPayload } from "@/features/analytics/server/countries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limitParam = searchParams.get("limit");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes enviar start y end (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const payload = await buildCountriesPayload({
      start,
      end,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=300" },
    });
  } catch (err) {
    const message =
      typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "GA4 error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
