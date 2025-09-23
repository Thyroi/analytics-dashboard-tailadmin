import type { Granularity } from "@/lib/types";
import type { KpiPayload } from "@/lib/api/analytics";

type Params = {
  start?: string;
  end?: string;
  granularity?: Granularity;
  signal?: AbortSignal;
};

export async function fetchKpis({ start, end, granularity, signal }: Params): Promise<KpiPayload> {
  const sp = new URLSearchParams();
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  if (granularity) sp.set("granularity", granularity);

  const url = `/api/analytics/v1/header/kpis?${sp.toString()}`;
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
      throw new Error(`404 en ${url}. ¿Existe src/app/api/analytics/v1/header/kpis/route.ts?`);
    }
    throw new Error(body || `HTTP ${resp.status} en ${url}`);
  }
  if (!ctype.includes("application/json")) {
    const body = await resp.text().catch(() => "");
    throw new Error(
      `Respuesta no JSON desde ${url}. content-type=${ctype}. Body=${body.slice(0, 200)}…`
    );
  }

  return resp.json() as Promise<KpiPayload>;
}
