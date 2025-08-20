import { router, protectedProcedure } from "../router";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserSchema, RoleSchema, SocialSchema } from "../schemas/user";

// --- middleware: solo ADMIN ---
const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.dbUser?.roles?.some(
    (r) => r.role.name.toUpperCase() === "ADMIN"
  );
  if (!isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
  return next();
});

const OkSchema = z.object({ ok: z.literal(true) });

export const adminRouter = router({
  // Listar usuarios (solo admin)
  listUsers: adminOnly
    .output(z.array(UserSchema))
    .query(async ({ ctx }) => {
      const rows = await ctx.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });

      // Normalizar social JSON -> objeto | null
      return rows.map((u) => {
        const raw = u.profile?.social ?? null;
        const parsed =
          raw === null
            ? null
            : (() => {
                const r = SocialSchema.safeParse(raw);
                return r.success ? r.data : null;
              })();

        return {
          ...u,
          profile: u.profile ? { ...u.profile, social: parsed } : null,
        };
      });
    }),

  // Listar roles (solo admin)
  listRoles: adminOnly
    .output(z.array(RoleSchema))
    .query(({ ctx }) => ctx.prisma.role.findMany({ orderBy: { name: "asc" } })),

  // Cambiar rol (solo admin)
  setUserRole: adminOnly
    .input(z.object({ userId: z.string(), roleId: z.number() }))
    .output(OkSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userRole.deleteMany({ where: { userId: input.userId } });
      await ctx.prisma.userRole.create({
        data: { userId: input.userId, roleId: input.roleId },
      });
      return { ok: true };
    }),

  // Eliminar usuario (solo admin)
  deleteUser: adminOnly
    .input(z.object({ userId: z.string() }))
    .output(OkSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.delete({ where: { id: input.userId } });
      return { ok: true };
    }),
});
