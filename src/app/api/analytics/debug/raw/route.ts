/**
 * Endpoint temporal para ver datos RAW de GA4
 */

import type { Granularity } from "@/lib/types";
import {
  getAuth,
  normalizePropertyId,
  resolvePropertyId,
} from "@/lib/utils/ga";
import { buildPageViewUnionRequest } from "@/lib/utils/ga4Requests";
import { computeRangesFromQuery } from "@/lib/utils/timeWindows";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const g = (searchParams.get("g") || "d").trim().toLowerCase();
    const startQ = searchParams.get("start");
    const endQ = searchParams.get("end");

    console.log("🔍 RAW DEBUG - Params:", { g, startQ, endQ });

    // Calcular rangos
    const ranges = computeRangesFromQuery(g as Granularity, startQ, endQ);

    console.log("🔍 RAW DEBUG - Ranges:", ranges);

    // GA4 Auth
    const auth = getAuth();
    const analytics = google.analyticsdata({ version: "v1beta", auth });
    const property = normalizePropertyId(resolvePropertyId());

    // Request body
    const requestBody = buildPageViewUnionRequest({
      current: ranges.current,
      previous: ranges.previous,
      granularity: g,
      metrics: [{ name: "eventCount" }],
    });

    console.log(
      "🔍 RAW DEBUG - Request Body:",
      JSON.stringify(requestBody, null, 2)
    );

    // Hacer la consulta a GA4
    const resp = await analytics.properties.runReport({
      property,
      requestBody,
    });

    // Devolver EXACTAMENTE lo que viene de GA4
    return NextResponse.json(
      {
        meta: {
          granularity: g,
          ranges,
          requestBody,
        },
        ga4Response: resp.data,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error en RAW debug:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
