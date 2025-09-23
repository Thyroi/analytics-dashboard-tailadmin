// lib/utils/ga.ts
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export function normalizePropertyId(id: string): string {
  const t = id.trim();
  return t.startsWith("properties/") ? t : `properties/${t}`;
}

/** Usamos SIEMPRE la propiedad de wpideanto por defecto */
export function resolvePropertyId(): string {
  const id = process.env.GA_PROPERTY_ID_WPIDEANTO ?? process.env.GA_PROPERTY_ID;
  if (!id) throw new Error("Falta GA_PROPERTY_ID_WPIDEANTO (o GA_PROPERTY_ID) en env");
  return id;
}

export function getAuth(): GoogleAuth {
  const clientEmail = getRequiredEnv("GA_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("GA_PRIVATE_KEY").replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}
