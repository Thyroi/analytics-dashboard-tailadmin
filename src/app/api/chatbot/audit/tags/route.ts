// src/app/api/chatbot/audit/tags/route.ts
import { NextResponse } from "next/server";

// ⚠️ Toggle inline (borra este if cuando ya no necesites mock)
// true  -> usa mockGenerator (sin red externa)
// false -> proxy a la API real
const USE_MOCK = true;

// Si luego dejas sólo la rama real, puedes borrar estas constantes:
const MINDSAIC_BASE_URL = "https://c01.mindsaic.com:2053";
const MINDSAIC_PATH = "/audit/tags";
const MINDSAIC_DB = "project_huelva";

type Gran = "d" | "w" | "m" | "y";
type ReqBody = {
  pattern: string;
  granularity: Gran;
  startTime?: string;
  endTime?: string;
  db?: string;
};
type Point = { time: string; value: number };
type OkPayload = { code: number; output: Record<string, Point[]> };

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    // Validación mínima
    if (!body?.pattern || !body?.granularity) {
      return NextResponse.json(
        { code: 400, error: "pattern y granularity son obligatorios" },
        { status: 400 }
      );
    }
    if (!["d", "w", "m", "y"].includes(body.granularity)) {
      return NextResponse.json(
        { code: 400, error: "granularity inválida" },
        { status: 400 }
      );
    }

    if (USE_MOCK) {
      // ===================== MOCK BRANCH =====================
      // Import dinámico para no cargar en el bundle si no hace falta
      const { generateMockResponse } = await import(
        "@/lib/mockData"
      );
      const payload: OkPayload = generateMockResponse({
        db: body.db ?? MINDSAIC_DB,
        pattern: body.pattern,
        granularity: body.granularity,
        startTime: body.startTime,
        endTime: body.endTime,
      });
      return NextResponse.json(payload, { status: 200 });
      // =======================================================
    } else {
      // ===================== REAL API BRANCH =================
      // Aquí va a la API real sin tocar envs (para que puedas copiar/pegar y borrar arriba)
      const url = `${MINDSAIC_BASE_URL}${MINDSAIC_PATH}`;
      console.log("[chatbot→real] POST", url, {
        db: body.db ?? MINDSAIC_DB,
        pattern: body.pattern,
        granularity: body.granularity,
        startTime: body.startTime,
        endTime: body.endTime,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s

      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          db: body.db ?? MINDSAIC_DB,
          pattern: body.pattern,
          granularity: body.granularity,
          ...(body.startTime ? { startTime: body.startTime } : null),
          ...(body.endTime ? { endTime: body.endTime } : null),
        }),
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { code: res.status, error: text || res.statusText },
          { status: 502 }
        );
      }

      const json = (await res.json()) as OkPayload;
      return NextResponse.json(json, { status: 200 });
      // =======================================================
    }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Timeout al conectar con Mindsaic"
          : err.message
        : "Unknown error";
    return NextResponse.json({ code: 500, error: msg }, { status: 500 });
  }
}
