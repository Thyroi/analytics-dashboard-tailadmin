import { NextResponse } from "next/server";
import { buildTopPagesPayload } from "@/features/analytics/server/topPages";
import type { ISODate } from "@/features/analytics/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") as ISODate | null;
    const end = searchParams.get("end") as ISODate | null;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Math.max(1, Number(limitRaw)) : 5;

    const data = await buildTopPagesPayload(start ?? undefined, end ?? undefined, limit);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
