import {
  handleUserAcquisitionRangeRequest,
  type AcquisitionRangePayload,
} from "@/lib/utils/analytics/timeSeriesHelpers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Re-export types for backward compatibility
export type { AcquisitionRangePayload };

export async function GET(req: Request) {
  try {
    const data = await handleUserAcquisitionRangeRequest(req);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
