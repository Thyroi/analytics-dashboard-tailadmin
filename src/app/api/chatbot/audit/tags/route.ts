import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Gran = "d" | "w" | "m" | "y";

/* ==================== utils fecha UTC ==================== */
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}
function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

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

/* ==================== rangos según consigna ====================

  - d (day-as-week): 7 días terminando en end (incl.), previous = [end-7, end-1]
  - w (igual que d, por tu ejemplo)
  - m (mensual "autobucket"): 33 días terminando en end, previous = [end-33, end-1]
  - y (anual 12 buckets): 365 días terminando en end, previous = [end-365, end-1]

  Nota: todos los rangos SON inclusivos.
*/
function computeRanges(gran: Gran, endISO?: string) {
  const end = endISO ? new Date(`${endISO}T00:00:00Z`) : yesterdayUTC();

  const spanByG: Record<Gran, number> = {
    d: 7, // 7 días (como tu ejemplo para day)
    w: 7, // igual que day (como indicaste)
    m: 33, // ventana "mensual" de 33 días (según tu ejemplo)
    y: 365, // ventana anual exacta de 365 días
  };

  const span = spanByG[gran];
  const currentStart = addDaysUTC(end, -(span - 1));
  const previousStart = addDaysUTC(end, -span);
  const previousEnd = addDaysUTC(end, -1);

  return {
    current: { start: toISO(currentStart), end: toISO(end) },
    previous: { start: toISO(previousStart), end: toISO(previousEnd) },
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const gran = (sp.get("granularity") || sp.get("g") || "d").trim() as Gran;
    if (!["d", "w", "m", "y"].includes(gran)) {
      return NextResponse.json(
        { code: 400, error: "granularity inválida. Usa d|w|m|y" },
        { status: 400 }
      );
    }

    const patterns = parsePatterns(sp);
    if (patterns.length === 0) {
      return NextResponse.json(
        {
          code: 400,
          error:
            "Debes pasar al menos un patrón vía ?patterns=foo,bar o ?patterns=foo&patterns=bar",
        },
        { status: 400 }
      );
    }

    // Permite fijar el ancla de fin por query (?end=YYYY-MM-DD); si no, ayer UTC
    const endISO = sp.get("end") || undefined;
    const db = sp.get("db") || undefined;

    // 1) Calcula los rangos con la política pedida
    const range = computeRanges(gran, endISO);

    // 2) Llama a tu endpoint real que pega a Mindsaic
    const internalUrl = new URL(
      "/api/chatbot/audit/tags",
      url.origin
    ).toString();
    const payload = {
      patterns,
      granularity: gran,
      ...(range.current.start ? { startTime: range.current.start } : null),
      ...(range.current.end ? { endTime: range.current.end } : null),
      ...(db ? { db } : null),
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
        { status: 502 }
      );
    }

    const json = await res.json();

    // 3) Inyecta meta/range con tu política (sin tocar el resto del payload)
    const out = {
      ...json,
      meta: {
        ...(json?.meta ?? {}),
        range,
        granularity: gran,
        timezone: "UTC",
      },
    };

    return NextResponse.json(out, { status: 200 });
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
    const { pattern, granularity, startTime, endTime, db } = body;

    // Validación básica
    if (!pattern || !granularity) {
      return NextResponse.json(
        { code: 400, error: "pattern y granularity son obligatorios" },
        { status: 400 }
      );
    }

    if (!["d", "w", "m", "y"].includes(granularity)) {
      return NextResponse.json(
        { code: 400, error: "granularity inválida. Usa d|w|m|y" },
        { status: 400 }
      );
    }

    // Llamada directa a la API de Mindsaic
    const mindsaicUrl = "https://c01.mindsaic.com:2053/audit/tags";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(mindsaicUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        db: db || "project_huelva",
        pattern,
        granularity,
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
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
