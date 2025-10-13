/**
 * Autenticación y configuración para Google Analytics 4
 * Consolidación de todas las utilidades de autenticación GA4
 */

import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

/* =================== Manejo de variables de entorno =================== */

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export function getOptionalEnv(
  name: string,
  defaultValue?: string
): string | undefined {
  return process.env[name] || defaultValue;
}

/* =================== Configuración de propiedades =================== */

/** Asegura el prefijo "properties/" en el ID de propiedad */
export function normalizePropertyId(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`;
}

/** Resuelve la propiedad por defecto (wpideanto primero, luego fallback) */
export function resolvePropertyId(): string {
  const id = process.env.GA_PROPERTY_ID_WPIDEANTO ?? process.env.GA_PROPERTY_ID;
  if (!id) {
    throw new Error(
      "Falta GA_PROPERTY_ID_WPIDEANTO (o GA_PROPERTY_ID) en las variables de entorno"
    );
  }
  return id;
}

/* =================== Autenticación =================== */

/** Crea instancia de autenticación para GA4 con permisos de solo lectura */
export function getAuth(): GoogleAuth {
  const clientEmail = getRequiredEnv("GA_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("GA_PRIVATE_KEY").replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

/** Crea cliente de Analytics Data API v1beta */
export function getAnalyticsDataClient(auth?: GoogleAuth) {
  const authInstance = auth || getAuth();
  return google.analyticsdata({ version: "v1beta", auth: authInstance });
}

/* =================== Validadores =================== */

export function validatePropertyId(id: string): boolean {
  const normalized = normalizePropertyId(id);
  return /^properties\/\d+$/.test(normalized);
}

export function validateCredentials(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    getRequiredEnv("GA_CLIENT_EMAIL");
  } catch {
    errors.push("GA_CLIENT_EMAIL no está definido");
  }

  try {
    getRequiredEnv("GA_PRIVATE_KEY");
  } catch {
    errors.push("GA_PRIVATE_KEY no está definido");
  }

  try {
    resolvePropertyId();
  } catch {
    errors.push("No se encontró ID de propiedad válido");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/* =================== Tipos exportados =================== */

export type { GoogleAuth } from "google-auth-library";
export type { analyticsdata_v1beta } from "googleapis";
