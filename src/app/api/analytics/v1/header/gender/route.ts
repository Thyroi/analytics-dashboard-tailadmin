// src/app/api/analytics/v1/header/gender/route.ts
import { handleSimpleDonutRequest } from "@/lib/utils/analytics/donutHelpers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toSpanishGenderLabel(v: string): string {
  const k = v.trim().toLowerCase();
  if (k === "male") return "Hombre";
  if (k === "female") return "Mujer";
  if (k === "unknown") return "Desconocido";
  return v;
}

export async function GET(req: NextRequest) {
  try {
    // Usar helper común para donuts simples
    const response = await handleSimpleDonutRequest(
      req,
      "userGender",
      "activeUsers"
    );

    // Traducir labels a español
    const translatedItems = response.items.map((item) => ({
      ...item,
      label: toSpanishGenderLabel(item.label),
    }));

    return NextResponse.json({
      ...response,
      items: translatedItems,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
