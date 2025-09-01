import type { AuditTagsBody, AuditTagsResponse, Granularity } from "@/features/chatbot/types/tags";

const INTERNAL_ENDPOINT = "/api/chatbot/tags";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isAuditTagsResponse(v: unknown): v is AuditTagsResponse {
  return isRecord(v) && typeof v.code === "number" && isRecord(v.output);
}

/** Llama a nuestra ruta interna (proxy) */
export async function postAuditTags(body: AuditTagsBody, options?: { signal?: AbortSignal }) {
  const res = await fetch(INTERNAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options?.signal,
    cache: "no-store",
  });

  const raw = await res.text();
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // keep as string
  }

  if (!res.ok || !isAuditTagsResponse(parsed)) {
    const details = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`AuditTags failed (status ${res.status}): ${details}`);
  }

  return parsed;
}

/** Patrones útiles */
export function childrenPattern(prefix: string) {
  return prefix && prefix !== "root" ? `${prefix}.*` : "root.*";
}
export function searchTokenPattern(token: string) {
  const safe = token.trim();
  if (!safe) throw new Error("Empty token");
  return `root.*.${safe}.*`;
}
export function exactPattern(prefix: string) {
  return prefix;
}

/** Factory de body */
export function makeBody(
  pattern: string,
  granularity: Granularity,
  startTime?: string,
  endTime?: string
): AuditTagsBody {
  return { pattern, granularity, ...(startTime ? { startTime } : {}), ...(endTime ? { endTime } : {}) };
}
