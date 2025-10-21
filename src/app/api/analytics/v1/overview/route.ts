import {
  handleOverviewRequest,
  type OverviewResponse,
} from "@/lib/utils/analytics/overviewHelpers";
import { NextResponse } from "next/server";

// Re-export types for backward compatibility
export type { OverviewResponse };

export async function GET(req: Request) {
  try {
    const payload = await handleOverviewRequest(req);
    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "InternalError", message: msg } },
      { status: 500 }
    );
  }
}
