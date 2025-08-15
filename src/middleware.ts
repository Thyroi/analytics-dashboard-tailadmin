// src/middleware.ts
import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/auth/:path*",      // <- monta /auth/login, /auth/logout, /auth/callback, etc.
    "/analytics/:path*", // <- tus rutas protegidas
  ],
};
