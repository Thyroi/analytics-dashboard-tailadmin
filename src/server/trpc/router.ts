import { ensureUser } from "@/server/auth/ensureUser";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

// 👇 Tipo que refleja el ctx luego de withDbUser
type DbUser = Awaited<ReturnType<typeof ensureUser>>;
type AuthedContext = Context & { dbUser: DbUser };

const t = initTRPC.context<Context>().create({ transformer: superjson });

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});

const withDbUser = t.middleware(async ({ ctx, next }) => {
  const u = ctx.session!.user;

  // Caso 1: Login con Auth0 (tiene 'sub')
  if (u.sub) {
    const dbUser = await ensureUser({
      sub: u.sub,
      email: u.email as string,
      picture: u.picture,
    });
    return next({ ctx: { ...ctx, dbUser } as AuthedContext });
  }

  // Caso 2: Login local (tiene 'userId')
  if (u.userId) {
    const dbUser = await ctx.prisma.user.findUnique({
      where: { id: u.userId },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });

    if (!dbUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuario no encontrado",
      });
    }

    return next({ ctx: { ...ctx, dbUser } as AuthedContext });
  }

  throw new TRPCError({ code: "UNAUTHORIZED" });
});

const requireAdmin = t.middleware(({ ctx, next }) => {
  // 👇 TS ya “ve” dbUser si casteamos a AuthedContext
  const { dbUser } = ctx as AuthedContext;
  const ok = dbUser.roles.some((r) => r.role.name === "ADMIN");
  if (!ok) throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Puedes encadenar así para mantener el tipado correcto:
export const protectedProcedure = t.procedure.use(isAuthed).use(withDbUser);
export const adminProcedure = t.procedure
  .use(isAuthed)
  .use(withDbUser)
  .use(requireAdmin);
