import { google, analyticsdata_v1beta } from "googleapis";
import type { GoogleAuth } from "google-auth-library";

export function normalizePropertyId(id: string): string {
  const t = id.trim();
  return t.startsWith("properties/") ? t : `properties/${t}`;
}

export function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function defaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 44); // ~45 días
  return { start: toISO(start), end: toISO(end) };
}

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return v;
}

/**
 * Devuelve el Property ID según una clave (sourceKey).
 * - "" | undefined => usa GA_PROPERTY_ID (default)
 * - "wpideanto"   => usa GA_PROPERTY_ID_WPIDEANTO
 */
export function resolvePropertyId(sourceKey?: string | null): string {
  const key = (sourceKey || "").trim().toLowerCase();
  if (key === "wpideanto") {
    return getRequiredEnv("GA_PROPERTY_ID_WPIDEANTO");
  }
  return getRequiredEnv("GA_PROPERTY_ID");
}

export function getAuth(): GoogleAuth {
  const clientEmail = getRequiredEnv("GA_CLIENT_EMAIL");
  const privateKeyRaw = getRequiredEnv("GA_PRIVATE_KEY");
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

export function getAnalyticsDataClient(
  auth: GoogleAuth
): analyticsdata_v1beta.Analyticsdata {
  return google.analyticsdata({ version: "v1beta", auth });
}
