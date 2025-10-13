// src/lib/utils/ga.ts
import { google, analyticsdata_v1beta } from "googleapis";
import { GoogleAuth } from "google-auth-library";

/* =================== ENV & HELPERS BÁSICOS =================== */

export function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

/** Asegura el prefijo "properties/". */
export function normalizePropertyId(id: string): string {
  const t = id.trim();
  return t.startsWith("properties/") ? t : `properties/${t}`;
}

/** Propiedad por defecto (wpideanto primero, si no, GA_PROPERTY_ID). */
export function resolvePropertyId(): string {
  const id = process.env.GA_PROPERTY_ID_WPIDEANTO ?? process.env.GA_PROPERTY_ID;
  if (!id) throw new Error("Falta GA_PROPERTY_ID_WPIDEANTO (o GA_PROPERTY_ID) en env");
  return id;
}

/** Auth para GA4 (readonly). */
export function getAuth(): GoogleAuth {
  const clientEmail = getRequiredEnv("GA_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("GA_PRIVATE_KEY").replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

/* =================== TIPOS =================== */

type RunReportReq = analyticsdata_v1beta.Schema$RunReportRequest;
type RunReportResp = analyticsdata_v1beta.Schema$RunReportResponse;

type Priority = "high" | "normal";

export type RunReportOptions = {
  propertyId?: string;        // si no, resolvePropertyId()
  signal?: AbortSignal;       // cancelación
  cacheKey?: string;          // de-dupe; si no, se usa el body serializado
  priority?: Priority;        // "high" salta parte de la cola (no supera el límite)
};

/* =================== LIMITADOR DE CONCURRENCIA =================== */

const MAX_CONCURRENCY = Math.max(
  1,
  Number(process.env.GA_MAX_CONCURRENCY ?? 3)
);

let inFlight = 0;

type QueueItem = {
  run: () => void;
  priority: Priority;
};

const queue: QueueItem[] = [];

function schedule(run: () => void, priority: Priority): void {
  // Inserción con prioridad simple (high hacia delante)
  if (priority === "high") queue.unshift({ run, priority });
  else queue.push({ run, priority });
  drain();
}

function drain(): void {
  while (inFlight < MAX_CONCURRENCY && queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    inFlight += 1;
    // Ejecuta en microtask para no bloquear
    queueMicrotask(() => item.run());
  }
}

function release(): void {
  inFlight = Math.max(0, inFlight - 1);
  drain();
}

function withConcurrency<T>(fn: () => Promise<T>, priority: Priority): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    schedule(() => {
      fn()
        .then((v) => {
          release();
          resolve(v);
        })
        .catch((err) => {
          release();
          reject(err);
        });
    }, priority);
  });
}

/* =================== SINGLE-FLIGHT (DE-DUPE) =================== */

const singleFlight = new Map<string, Promise<RunReportResp>>();

function stableStringify(x: unknown): string {
  try {
    return JSON.stringify(x);
  } catch {
    return "[unserializable]";
  }
}

/* =================== CIRCUIT BREAKER =================== */

const CB_FAIL_THRESHOLD = Math.max(1, Number(process.env.GA_CB_FAILS ?? 5));
const CB_COOLDOWN_MS = Math.max(1000, Number(process.env.GA_CB_COOLDOWN_MS ?? 20_000));

type CbState = {
  consecutiveFails: number;
  openUntil: number; // epoch ms; 0 = cerrado
};

const cbByProperty = new Map<string, CbState>();

function nowMs(): number {
  return Date.now();
}

function getCbState(prop: string): CbState {
  const cur = cbByProperty.get(prop);
  if (cur) return cur;
  const init: CbState = { consecutiveFails: 0, openUntil: 0 };
  cbByProperty.set(prop, init);
  return init;
}

function cbCanProceed(prop: string): boolean {
  const s = getCbState(prop);
  if (s.openUntil > 0 && nowMs() < s.openUntil) return false;
  return true;
}

function cbRegisterSuccess(prop: string): void {
  const s = getCbState(prop);
  s.consecutiveFails = 0;
  s.openUntil = 0;
}

function cbRegisterFailure(prop: string): void {
  const s = getCbState(prop);
  s.consecutiveFails += 1;
  if (s.consecutiveFails >= CB_FAIL_THRESHOLD) {
    s.openUntil = nowMs() + CB_COOLDOWN_MS;
  }
}

/* =================== RETRY CON BACKOFF =================== */

const MAX_ATTEMPTS = Math.max(1, Number(process.env.GA_MAX_ATTEMPTS ?? 4));
const BACKOFF_BASE_MS = Math.max(50, Number(process.env.GA_BACKOFF_BASE_MS ?? 300));
const BACKOFF_FACTOR = Math.max(1.1, Number(process.env.GA_BACKOFF_FACTOR ?? 2));

function jitter(): number {
  // 0..100ms
  return Math.floor(Math.random() * 100);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return new Promise((res) => setTimeout(res, ms));
  return new Promise((res, rej) => {
    const id = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      res();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      rej(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Detección conservadora de errores reintables. */
function isRetryableError(err: unknown): boolean {
  // Abort manual → no reintentar
  if (err instanceof DOMException && err.name === "AbortError") return false;

  // Intentar leer algunos campos comunes
  const maybeObj = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null;

  const codeVal = maybeObj?.code; // googleapis suele adjuntar numeric code
  if (typeof codeVal === "number") {
    if (codeVal === 429) return true; // rate limit
    if (codeVal >= 500 && codeVal <= 599) return true; // server errors
  }

  const message = typeof maybeObj?.message === "string" ? maybeObj.message.toLowerCase() : "";
  if (
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("exceeded") ||
    message.includes("deadline") ||
    message.includes("unavailable") ||
    message.includes("internal error")
  ) {
    return true;
  }

  // Errores de red típicos
  const syscall = typeof maybeObj?.syscall === "string" ? maybeObj.syscall : "";
  const codeStr = typeof maybeObj?.code === "string" ? maybeObj.code : "";
  if (
    codeStr === "ECONNRESET" ||
    codeStr === "ETIMEDOUT" ||
    syscall === "connect" ||
    syscall === "read"
  ) {
    return true;
  }

  return false;
}

/* =================== runReportSafe =================== */

/**
 * Ejecuta properties.runReport con:
 * - límite de concurrencia
 * - de-dupe opcional (single-flight)
 * - retries exponenciales con jitter en errores reintables (429/5xx/cuota)
 * - circuit breaker por propiedad
 */
export async function runReportSafe(
  body: RunReportReq,
  opts?: RunReportOptions
): Promise<RunReportResp> {
  const propertyRaw = opts?.propertyId ?? resolvePropertyId();
  const property = normalizePropertyId(propertyRaw);
  const priority = opts?.priority ?? "normal";
  const cacheKey = opts?.cacheKey ?? `${property}|${stableStringify(body)}`;
  const signal = opts?.signal;

  // Circuit breaker
  if (!cbCanProceed(property)) {
    throw new Error("Circuit breaker abierto para GA4 (cooldown activo)");
  }

  // Single-flight (si ya hay una misma petición en curso, comparte promesa)
  const existing = singleFlight.get(cacheKey);
  if (existing) return existing;

  // Crea la promesa "trabajo real"
  const job = withConcurrency<RunReportResp>(
    async () => {
      let attempt = 0;
      // Auth + cliente
      const auth = getAuth();
      const analytics = google.analyticsdata({ version: "v1beta", auth });

      while (true) {
        attempt += 1;
        try {
          // Permite cancelación antes de llamar
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

          // NOTA IMPORTANTE: NO tipamos como GaxiosResponse<T> para evitar el error de headers.
          const resp = await analytics.properties.runReport({
            property,
            requestBody: body,
          });

          cbRegisterSuccess(property);

          const data: RunReportResp = resp.data as RunReportResp; // data sí queda fuertemente tipada
          return data;
        } catch (err) {
          // Si no es reintable o ya agotamos intentos → registrar fallo y propagar
          const retryable = isRetryableError(err);
          if (!retryable || attempt >= MAX_ATTEMPTS) {
            cbRegisterFailure(property);
            throw err;
          }

          // Backoff exponencial con jitter
          const delay =
            Math.floor(BACKOFF_BASE_MS * Math.pow(BACKOFF_FACTOR, attempt - 1)) + jitter();

          // Si hay cancelación durante la espera, aborta
          await sleep(delay, signal);
          // loop -> reintento
        }
      }
    },
    priority
  );

  // Guarda en single-flight y limpia al completar
  singleFlight.set(cacheKey, job);
  try {
    const res = await job;
    return res;
  } finally {
    singleFlight.delete(cacheKey);
  }
}

/* ============== Azúcar opcional: versión con propiedad implícita ============== */

/**
 * Versión de conveniencia si solo quieres pasar body y (opcional) signal/priority.
 */
export async function runReport(
  body: RunReportReq,
  signal?: AbortSignal,
  priority?: Priority
): Promise<RunReportResp> {
  return runReportSafe(body, { signal, priority });
}
