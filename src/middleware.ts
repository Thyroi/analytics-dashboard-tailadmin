// src/middleware.ts
import { auth0 } from "@/lib/auth0";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/auth/:path*", // <- Auth0 routes (login, logout, callback, profile)
    "/analytics/:path*", // <- tus rutas protegidas
  ],
};
