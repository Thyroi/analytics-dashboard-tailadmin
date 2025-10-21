import {
  handleCitiesRequest,
  type CitiesResponse as CitiesPayload,
  type CityRow,
} from "@/lib/utils/analytics/donutHelpers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Re-export types for backward compatibility
export type { CitiesPayload, CityRow };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { pathname } = url;

    // Extract country and region from path
    const match = pathname.match(
      /\/api\/analytics\/v1\/header\/countries\/([^/]+)\/regions\/([^/]+)\/cities\/?$/
    );
    if (!match) {
      return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
    }

    const countryCode = decodeURIComponent(match[1] ?? "").toUpperCase();
    const regionName = decodeURIComponent(match[2] ?? "");

    if (!countryCode || countryCode.length !== 2 || !regionName) {
      return NextResponse.json(
        { error: "country (ISO-2) y region son requeridos" },
        { status: 400 }
      );
    }

    const data = await handleCitiesRequest(req, countryCode, regionName);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
