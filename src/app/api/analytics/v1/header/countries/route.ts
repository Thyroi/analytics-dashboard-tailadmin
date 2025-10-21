import {
  handleCountriesRequest,
  type CountriesResponse,
  type CountryRow,
} from "@/lib/utils/analytics/donutHelpers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Re-export types for backward compatibility
export type { CountryRow };
export type CountriesPayload = CountriesResponse;

export async function GET(req: NextRequest) {
  try {
    const data = await handleCountriesRequest(req);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
