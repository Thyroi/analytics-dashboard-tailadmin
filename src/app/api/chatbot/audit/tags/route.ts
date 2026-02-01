import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* ==================== parseo de query ==================== */
function parsePatterns(sp: URLSearchParams): string[] {
  // Soporta ?patterns=a,b y/o múltiples ?patterns=...
  const all = sp.getAll("patterns");
  const flat = all
    .flatMap((v) => v.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(flat));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const patterns = parsePatterns(sp);
    if (patterns.length === 0) {
      return NextResponse.json(
        {
          code: 400,
          error:
            "Debes pasar al menos un patrón vía ?patterns=foo,bar o ?patterns=foo&patterns=bar",
        },
        { status: 400 },
      );
    }

    const startISO = sp.get("start") || null;
    const endISO = sp.get("end") || null;
    const id = sp.get("id") || "huelva";

    // 2) Convierte fechas YYYY-MM-DD a YYYYMMDD para el API de Mindsaic
    const formatDateForMindsaic = (dateISO: string) =>
      dateISO.replace(/-/g, "");

    // Proxy a Mindsaic v2
    const internalUrl = new URL(
      "/api/chatbot/audit/tags",
      url.origin,
    ).toString();
    const payload = {
      id,
      patterns,
      ...(startISO ? { startTime: formatDateForMindsaic(startISO) } : null),
      ...(endISO ? { endTime: formatDateForMindsaic(endISO) } : null),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(internalUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { code: res.status, error: text || res.statusText },
        { status: 502 },
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Timeout al consultar overview"
          : err.message
        : "Unknown error";
    return NextResponse.json({ code: 500, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patterns, startTime, endTime, id } = body;

    // Validación básica
    if (!patterns || !startTime) {
      return NextResponse.json(
        { code: 400, error: "patterns y startTime son obligatorios" },
        { status: 400 },
      );
    }

    // Llamada directa a la API de Mindsaic v2
    const mindsaicUrl = "https://c00.mindsaic.com:2053/tags/data";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Build headers, include internal token header if configured
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const internalToken = process.env.MINDSAIC_INTERNAL_TOKEN;
    if (internalToken) {
      // Use the agreed header name with Mindsaic
      forwardHeaders["x-internal-auth"] = internalToken;
    }

    const res = await fetch(mindsaicUrl, {
      method: "POST",
      signal: controller.signal,
      headers: forwardHeaders,
      body: JSON.stringify({
        id: id || "huelva",
        patterns,
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { code: res.status, error: text || res.statusText },
        { status: 502 },
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
