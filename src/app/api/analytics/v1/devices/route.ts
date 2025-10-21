import { handleSimpleDonutRequest } from "@/lib/utils/analytics/donutHelpers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/analytics/v1/devices
 * Retorna usuarios agrupados por tipo de dispositivo (desktop, mobile, tablet)
 */
export async function GET(req: NextRequest) {
  try {
    // Usar helper común para donuts simples
    const response = await handleSimpleDonutRequest(
      req,
      "deviceCategory",
      "activeUsers"
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error en /api/analytics/v1/devices:", error);
    return NextResponse.json(
      { error: "Error obteniendo datos de dispositivos" },
      { status: 500 }
    );
  }
}
