import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Returns the public egress IP address seen by an external service for a request
// initiated by this serverless function. Useful to provide to upstream services
// that want to whitelist source IPs.
export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // api.ipify.org is a small public service that returns the caller IP
    const res = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: text || res.statusText },
        { status: 502 }
      );
    }

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(
      { ok: true, ip: json.ip || null },
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
