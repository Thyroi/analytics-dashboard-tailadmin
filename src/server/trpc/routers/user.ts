// server/trpc/routers/user.ts
import { Prisma } from "@prisma/client";
import { router, protectedProcedure, publicProcedure } from "../router";
import {
  ProfileSchema,
  SocialSchema,
  UpdateProfileSchema,
  UserSchema,
  type Social,
} from "../schemas/user";

/** Normaliza JSON de Prisma -> Social | null */
function normalizeSocialFromPrisma(json: unknown): Social | null {
  if (json === null || json === undefined) return null;
  const parsed = SocialSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

/** Convierte Social | null | undefined a Prisma.InputJsonValue | undefined
 *  - undefined  => no tocar el campo
 *  - null       => guardar {} (vacío)
 *  - objeto     => guardar tal cual
 */
function encodeSocial(
  social: Social | null | undefined
): Prisma.InputJsonValue | undefined {
  if (typeof social === "undefined") return undefined;
  if (social === null) return {} as Prisma.InputJsonValue;
  return social as Prisma.InputJsonValue;
}

export const userRouter = router({
  /** === ME (requiere sesión y usuario ya creado) === */
  me: protectedProcedure
    .output(UserSchema.nullable())
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.dbUser!.id },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });
      if (!user) return null;

      const social = normalizeSocialFromPrisma(user.profile?.social ?? null);
      return {
        ...user,
        profile: user.profile ? { ...user.profile, social } : null,
      };
    }),

  /** === ME (opcional): NO lanza 401, y AUTO-CREA usuario en DB si hay sesión === */
  meOptional: publicProcedure
    .output(UserSchema.nullable())
    .query(async ({ ctx }) => {
      // si no hay sesión Auth0 → null silencioso (nada de 401)
      const sessUser = ctx.session?.user;
      if (!sessUser) return null;

      // datos mínimos de Auth0
      const sub = (sessUser as Record<string, unknown>)["sub"] as string | undefined;
      const email = (sessUser as Record<string, unknown>)["email"] as string | undefined;
      const picture = (sessUser as Record<string, unknown>)["picture"] as string | undefined;

      if (!sub || !email) {
        // sesión inválida/incompleta → tratar como no autenticado
        return null;
      }

      // upsert para que exista en DB (y actualizar avatar si cambió)
      const dbUser = await ctx.prisma.user.upsert({
        where: { auth0Sub: sub },
        create: {
          auth0Sub: sub,
          email,
          avatarUrl: picture ?? null,
        },
        update: {
          avatarUrl: picture ?? null,
        },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });

      const social = normalizeSocialFromPrisma(dbUser.profile?.social ?? null);
      return {
        ...dbUser,
        profile: dbUser.profile ? { ...dbUser.profile, social } : null,
      };
    }),

  /** === UPDATE / UPSERT PROFILE === */
  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .output(ProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { social, ...rest } = input;

      const updateData: Prisma.ProfileUpdateInput = {
        ...rest,
        social: encodeSocial(social),
      };

      const createData: Prisma.ProfileUncheckedCreateInput = {
        userId: ctx.dbUser!.id,
        ...rest,
        social: encodeSocial(social),
      };

      const saved = await ctx.prisma.profile.upsert({
        where: { userId: ctx.dbUser!.id },
        update: updateData,
        create: createData,
      });

      return {
        ...saved,
        social: normalizeSocialFromPrisma(saved.social ?? null),
      };
    }),
});
