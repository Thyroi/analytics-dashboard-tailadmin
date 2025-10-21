import {
  handleRegionsRequest,
  type RegionRow,
  type RegionsResponse as RegionsPayload,
} from "@/lib/utils/analytics/donutHelpers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Re-export types for backward compatibility
export type { RegionRow, RegionsPayload };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { pathname } = url;

    // Extract country code from path
    const match = pathname.match(
      /\/api\/analytics\/v1\/header\/countries\/([^/]+)\/regions\/?$/
    );
    if (!match) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }

    const countryCode = decodeURIComponent(match[1] ?? "").toUpperCase();
    if (!countryCode || countryCode.length !== 2) {
      return NextResponse.json(
        { error: "country (ISO-2) es requerido" },
        { status: 400 }
      );
    }

    const data = await handleRegionsRequest(req, countryCode);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
