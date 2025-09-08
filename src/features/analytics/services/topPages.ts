import type { TopPagesResponse, ISODate } from "../types";

export async function fetchTopPages(opts?: {
  start?: ISODate;
  end?: ISODate;
  limit?: number;
  signal?: AbortSignal;
}): Promise<TopPagesResponse> {
  const params = new URLSearchParams();
  if (opts?.start) params.set("start", opts.start);
  if (opts?.end) params.set("end", opts.end);
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit));

  const res = await fetch(`/api/analytics/top-pages?${params}`, {
    method: "GET",
    signal: opts?.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as TopPagesResponse;
}
