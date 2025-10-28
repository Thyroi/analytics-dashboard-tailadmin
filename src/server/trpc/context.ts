import { auth0 } from "@/lib/auth0";
import { verifyJWT } from "@/lib/jwt";
import { prisma } from "@/server/db";
import type { Prisma, PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

// Tipo del usuario que guardas en contexto (incluye relaciones que usas)
export type DbUser = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    profile: true;
  };
}>;

export type SessionUser = {
  sub?: string; // Auth0
  email?: string;
  picture?: string;
  userId?: string; // Login local
};

export type SessionData = { user: SessionUser } | null;

export type Context = {
  prisma: PrismaClient;
  session: SessionData;
  dbUser?: DbUser; // <-- ya NO es unknown
};

export async function createContext(): Promise<Context> {
  // 1. Intentar obtener sesión de Auth0
  const auth0Session = await auth0.getSession();
  if (auth0Session) {
    return { prisma, session: auth0Session };
  }

  // 2. Si no hay Auth0, intentar JWT local
  const cookieStore = await cookies();
  const localToken = cookieStore.get("local-auth-token")?.value;

  if (localToken) {
    const payload = await verifyJWT(localToken);
    if (payload) {
      // Crear sesión compatible con el formato esperado
      return {
        prisma,
        session: {
          user: {
            userId: payload.userId,
            email: payload.email,
          },
        },
      };
    }
  }

  // 3. No hay sesión
  return { prisma, session: null };
}
