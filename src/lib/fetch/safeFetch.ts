export class ChallengeError extends Error {
  public body?: string;
  public status?: number;
  constructor(message: string, body?: string, status?: number) {
    super(message);
    this.name = "ChallengeError";
    this.body = body;
    this.status = status;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * safeJsonFetch: wrapper around fetch that detects HTML challenges (Cloudflare)
 * - retries a couple times with backoff when HTML/challenge detected
 * - throws ChallengeError with truncated body when challenge persists
 * - returns parsed JSON for successful responses
 */
export async function safeJsonFetch(
  url: string,
  opts: RequestInit = {},
  retries = 2
): Promise<unknown> {
  type FetchError = Error & { status?: number; body?: unknown };

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const optsWithSignal = opts as RequestInit & { signal?: AbortSignal };
    const signal = optsWithSignal.signal ?? controller.signal;

    try {
      const res = await fetch(url, { ...opts, signal });
      // Some test mocks may not provide headers.get or text — guard defensively
      const maybeRes = res as unknown as Record<string, unknown>;
      const headers = (maybeRes && (maybeRes.headers as unknown)) as
        | { get?: (k: string) => string | null }
        | undefined;
      const contentType =
        headers && typeof headers.get === "function"
          ? headers.get("content-type") ?? ""
          : "";

      // Some environments (and the Fetch spec) make response bodies single-use.
      // To avoid "body stream already read" we prefer to use `res.clone()`
      // when available for a safe second reader. If clone is not present
      // (test mocks), we fall back to reading text once and parsing JSON from it.
      const hasJson =
        maybeRes && typeof (maybeRes.json as unknown) === "function";
      const hasText =
        maybeRes && typeof (maybeRes.text as unknown) === "function";

      let parsedJson: unknown | undefined = undefined;
      let text = "";

      // If clone() exists we can safely call json() on the clone without
      // consuming the original stream. If clone is not available but json()
      // exists (test mocks), we'll call json() once on the provided object.
      const canClone =
        typeof (res as unknown as { clone?: () => Response }).clone ===
        "function";

      if (hasJson) {
        if (canClone) {
          try {
            parsedJson = await (res.clone() as Response).json();
          } catch {
            parsedJson = undefined;
          }
        } else {
          // No clone() available — call json() directly on the mock/response.
          try {
            parsedJson = await (maybeRes.json as unknown as () => Promise<unknown>)();
          } catch {
            parsedJson = undefined;
          }
        }
      }

      // Only read text() if we couldn't obtain parsedJson and text() is available.
      if (parsedJson === undefined && hasText) {
        try {
          text = await (maybeRes.text as unknown as () => Promise<string>)();
        } catch {
          text = "";
        }
        try {
          parsedJson = text ? JSON.parse(text) : undefined;
        } catch {
          parsedJson = undefined;
        }
      }

      const looksLikeHtml =
        contentType.includes("text/html") ||
        (typeof text === "string" &&
          (text.trim().startsWith("<!DOCTYPE html") ||
            /Just a moment|Enable JavaScript and cookies to continue/i.test(
              text
            )));

      if (looksLikeHtml) {
        const truncated = (text || "").slice(0, 2000);
        if (attempt <= retries) {
          const backoff =
            Math.min(2000, 300 * 2 ** attempt) + Math.random() * 200;
          await delay(backoff);
          continue;
        }

        throw new ChallengeError(
          "Upstream returned HTML challenge",
          truncated,
          res.status
        );
      }

      if (!res.ok) {
        // Try to return useful error info
        if (parsedJson !== undefined) {
          const obj = parsedJson as Record<string, unknown>;
          const maybeMsg = obj?.error ?? obj?.message;
          const msg =
            typeof maybeMsg === "string"
              ? maybeMsg
              : `HTTP ${res.status}: ${res.statusText}`;
          const err = new Error(msg) as FetchError;
          err.status = res.status;
          err.body = parsedJson;
          throw err;
        }

        try {
          const errJson = text ? (JSON.parse(text) as unknown) : undefined;
          const obj =
            errJson && typeof errJson === "object"
              ? (errJson as Record<string, unknown>)
              : undefined;
          const maybeMsg = obj?.error ?? obj?.message;
          const msg =
            typeof maybeMsg === "string"
              ? maybeMsg
              : `HTTP ${res.status}: ${res.statusText}`;
          const err = new Error(msg) as FetchError;
          err.status = res.status;
          err.body = errJson ?? text;
          throw err;
        } catch {
          const truncated = (text || "").slice(0, 2000);
          const err = new Error(
            `HTTP ${res.status}: ${res.statusText} - ${truncated}`
          ) as FetchError;
          err.status = res.status;
          err.body = truncated;
          throw err;
        }
      }

      // Success: prefer parsedJson (from json()) when available, otherwise parse text
      if (parsedJson !== undefined) return parsedJson;

      try {
        return text ? JSON.parse(text) : {};
      } catch {
        const truncated = (text || "").slice(0, 2000);
        const err = new Error(`invalid_json`) as FetchError;
        err.body = truncated;
        err.status = res.status;
        throw err;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      if (err instanceof ChallengeError) throw err;
      if (attempt <= retries) {
        const backoff =
          Math.min(2000, 300 * 2 ** attempt) + Math.random() * 200;
        await delay(backoff);
        continue;
      }
      throw err;
    }
  }
}
