import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side helper that does a fetch to a relative path on the same origin
 * including the `x-internal-auth` header taken from MINDSAIC_INTERNAL_TOKEN.
 *
 * Usage:
 * GET /api/debug/send-internal?target=/api/debug/echo-headers
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("target") || "/api/debug/echo-headers";
    // Only allow relative paths to avoid SSRF risks
    if (!target.startsWith("/")) {
      return NextResponse.json({ ok: false, error: "target must be a relative path" }, { status: 400 });
    }

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = process.env.MINDSAIC_INTERNAL_TOKEN;
    if (token) {
      forwardHeaders["x-internal-auth"] = token;
    }

    const full = new URL(target, url.origin).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(full, { method: "GET", headers: forwardHeaders, signal: controller.signal }).finally(() => clearTimeout(timeout));

    const text = await res.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // leave as raw text
    }

    return NextResponse.json({ ok: true, forwardedTo: full, status: res.status, response: parsed }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? (err.name === "AbortError" ? "Timeout" : err.message) : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
