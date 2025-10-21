import { NextResponse } from "next/server";
import { 
  handleTopPagesRangeRequest,
  type TopPagesRangePayload 
} from "@/lib/utils/analytics/timeSeriesHelpers";

export const dynamic = "force-dynamic";

// Re-export types for backward compatibility
export type { TopPagesRangePayload };

export async function GET(req: Request) {
  try {
    const data = await handleTopPagesRangeRequest(req);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
