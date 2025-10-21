// src/app/api/analytics/v1/devices/os/route.ts
import { handleSimpleDonutRequest } from "@/lib/utils/analytics/donutHelpers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Usar helper común para donuts simples
    const response = await handleSimpleDonutRequest(
      req,
      "operatingSystem",
      "activeUsers"
    );

    return NextResponse.json(response);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
