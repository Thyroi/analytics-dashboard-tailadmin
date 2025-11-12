import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnostic endpoint that proxies a small request to the real Mindsaic upstream
// and returns limited header + body snippet information so we can detect
// Cloudflare/JS-challenge responses when called from the deployed Vercel server.
export async function GET() {
  try {
    const mindsaicUrl = "https://c01.mindsaic.com:2053/audit/tags";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Minimal payload likely to produce small JSON (adjust pattern if needed)
    const payload = {
      db: "project_huelva",
      patterns: ["root.almonte.playas"],
      granularity: "d",
    };

    const res = await fetch(mindsaicUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).finally(() => clearTimeout(timeout));

    // Grab a few interesting headers (non-exhaustive)
    const headersObj: Record<string, string | null> = {};
    try {
      const keys = [
        "server",
        "cf-ray",
        "cf-chl-bypass",
        "content-type",
        "x-cache",
        "via",
      ];
      for (const k of keys) {
        headersObj[k] = res.headers.get(k);
      }
    } catch {
      // ignore header reading errors
    }

    const status = res.status;

    // Read up to 4096 chars of the body for inspection (truncated)
    let bodySnippet = "";
    try {
      const text = await res.text();
      bodySnippet = text ? text.slice(0, 4096) : "";
    } catch {
      bodySnippet = "<unable to read body>";
    }

    // Do not return the full body to avoid exposing large HTML; truncated is enough
    return NextResponse.json(
      {
        ok: true,
        upstream: mindsaicUrl,
        status,
        headers: headersObj,
        bodySnippet,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "timeout"
          : err.message
        : "unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
