import { NextResponse } from "next/server";

// Runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tipos
type Granularity = "d" | "w" | "m" | "y";

type SeriesPoint = { time: string; value: number };
type AuditTagsOutput = Record<string, SeriesPoint[]>;
type AuditTagsResponse = { code: number; output: AuditTagsOutput };

type AuditTagsBody = {
  pattern: string;
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
};

// Env
const BASE_URL = process.env.MINDSAIC_BASE_URL ?? "https://c01.mindsaic.com:2053";
const PATH = process.env.MINDSAIC_AUDIT_TAGS_PATH ?? "/audit/tags";
const FIXED_DB = process.env.MINDSAIC_DB ?? "project_huelva";

// Type guards
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isAuditTagsResponse(v: unknown): v is AuditTagsResponse {
  return (
    isRecord(v) &&
    typeof v.code === "number" &&
    isRecord(v.output)
  );
}
function isAbortError(e: unknown): boolean {
  return isRecord(e) && typeof (e as { name?: unknown }).name === "string" && (e as { name: string }).name === "AbortError";
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(payload) || typeof payload.pattern !== "string" || typeof payload.granularity !== "string") {
    return NextResponse.json(
      { message: "Missing or invalid fields: pattern, granularity" },
      { status: 400 }
    );
  }

  const body: Record<string, unknown> = {
    db: FIXED_DB,
    pattern: payload.pattern,
    granularity: payload.granularity,
  };
  if (typeof payload.startTime === "string" && payload.startTime) body.startTime = payload.startTime;
  if (typeof payload.endTime === "string" && payload.endTime) body.endTime = payload.endTime;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);

  try {
    const upstream = await fetch(`${BASE_URL}${PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(t);

    // Leemos como texto para evitar errores de parseo y poder incluir el cuerpo en caso de fallo
    const raw = await upstream.text();
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // se queda como string
    }

    if (!upstream.ok || !isAuditTagsResponse(parsed) || parsed.code !== 200) {
      return NextResponse.json(
        { message: "Upstream error", status: upstream.status, data: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (e: unknown) {
    clearTimeout(t);
    return NextResponse.json(
      { message: isAbortError(e) ? "Upstream timeout" : "Upstream fetch failed" },
      { status: 504 }
    );
  }
}
