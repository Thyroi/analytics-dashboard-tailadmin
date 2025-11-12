import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const headers: Record<string, string | undefined> = {};
    for (const [k, v] of req.headers) {
      headers[k] = v;
    }
    return NextResponse.json({ ok: true, headers }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const headers: Record<string, string | undefined> = {};
    for (const [k, v] of req.headers) {
      headers[k] = v;
    }
    return NextResponse.json({ ok: true, headers }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
