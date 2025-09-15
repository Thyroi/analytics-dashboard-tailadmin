import { NextResponse } from "next/server";
import { buildUserActivityPayload } from "@/features/analytics/server/userActivity";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start  = searchParams.get("start") || undefined;
    const end    = searchParams.get("end") || undefined;
    const source = (searchParams.get("source") as "wpideanto" | null) || undefined;

    const payload = await buildUserActivityPayload({ start, end, source });
    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
