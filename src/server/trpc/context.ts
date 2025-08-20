import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { auth0 } from "@/lib/auth0";

// Tipo del usuario que guardas en contexto (incluye relaciones que usas)
export type DbUser = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    profile: true;
  };
}>;

export type SessionUser = {
  sub: string;
  email?: string;
  picture?: string;
};

export type SessionData = { user: SessionUser } | null;

export type Context = {
  prisma: PrismaClient;
  session: SessionData;
  dbUser?: DbUser;     // <-- ya NO es unknown
};

export async function createContext(): Promise<Context> {
  const session = await auth0.getSession();
  return { prisma, session };
}

