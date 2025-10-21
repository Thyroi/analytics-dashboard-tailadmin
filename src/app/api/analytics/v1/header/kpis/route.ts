// src/app/api/analytics/v1/header/kpis/route.ts
import type { Granularity } from "@/lib/types";
import { handleKpiRequest } from "@/lib/utils/analytics/kpiHelpers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ======================= handler ======================= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const startQ = sp.get("start");
    const endQ = sp.get("end");
    const granularity = (sp.get("granularity") || "d") as Granularity;

    // Usar helper común para KPIs
    const response = await handleKpiRequest(granularity, startQ, endQ);

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
