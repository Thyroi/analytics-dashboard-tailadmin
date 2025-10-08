import { NextResponse } from "next/server";

const MINDSAIC_BASE_URL = "https://c01.mindsaic.com:2053";
const MINDSAIC_PATH = "/audit/tags";
const MINDSAIC_DB = "project_huelva";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patterns, granularity, startTime, endTime, db } = body;

    // Validación mínima
    if (!Array.isArray(patterns) || patterns.length === 0 || !granularity) {
      return NextResponse.json(
        { code: 400, error: "patterns (array) y granularity son obligatorios" },
        { status: 400 }
      );
    }
    if (!["d", "w", "m", "y"].includes(granularity)) {
      return NextResponse.json(
        { code: 400, error: "granularity inválida" },
        { status: 400 }
      );
    }

    // Proxy a la API real
    const url = `${MINDSAIC_BASE_URL}${MINDSAIC_PATH}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        db: db ?? MINDSAIC_DB,
        patterns,
        granularity,
        ...(startTime ? { startTime } : null),
        ...(endTime ? { endTime } : null),
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { code: res.status, error: text || res.statusText },
        { status: 502 }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
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
