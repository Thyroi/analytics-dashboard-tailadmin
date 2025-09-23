import type { Granularity } from "@/lib/types";
import type { TopPagesRangePayload } from "@/lib/api/analytics";

type Params = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  top?: number;            // default 5
  includeTotal?: boolean;  // default true
  signal?: AbortSignal;
};

export async function fetchTopPagesRange({
  start,
  end,
  granularity,
  top = 5,
  includeTotal = true,
  signal,
}: Params): Promise<TopPagesRangePayload> {
  const sp = new URLSearchParams();
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  if (granularity) sp.set("granularity", granularity);
  if (top) sp.set("top", String(top));
  if (!includeTotal) sp.set("includeTotal", "0");

  const url = `/api/analytics/v1/header/top-pages-range?${sp.toString()}`;

  const resp = await fetch(url, {
    method: "GET",
    signal,
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });

  const ctype = resp.headers.get("content-type") || "";
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    if (ctype.includes("text/html")) {
      throw new Error(
        `404 en ${url}. ¿Existe src/app/api/analytics/v1/header/top-pages-range/route.ts?`
      );
    }
    throw new Error(body || `HTTP ${resp.status} en ${url}`);
  }
  if (!ctype.includes("application/json")) {
    const body = await resp.text().catch(() => "");
    throw new Error(
      `Respuesta no JSON desde ${url}. content-type=${ctype}. Body=${body.slice(0, 200)}…`
    );
  }

  return resp.json() as Promise<TopPagesRangePayload>;
}
