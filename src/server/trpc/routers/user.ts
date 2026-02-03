// server/trpc/routers/user.ts
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../router";
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
  social: Social | null | undefined,
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
      // si no hay sesión → null silencioso (nada de 401)
      const sessUser = ctx.session?.user;
      if (!sessUser) return null;

      // CASO 1: Login Local (tiene userId directamente)
      const userId = (sessUser as Record<string, unknown>)["userId"] as
        | string
        | undefined;
      if (userId) {
        const dbUser = await ctx.prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            roles: { include: { role: true } },
          },
        });

        if (!dbUser) return null;

        const social = normalizeSocialFromPrisma(
          dbUser.profile?.social ?? null,
        );
        return {
          ...dbUser,
          profile: dbUser.profile ? { ...dbUser.profile, social } : null,
        };
      }

      // CASO 2: Auth0 (tiene sub)
      const sub = (sessUser as Record<string, unknown>)["sub"] as
        | string
        | undefined;
      const email = (sessUser as Record<string, unknown>)["email"] as
        | string
        | undefined;
      const picture = (sessUser as Record<string, unknown>)["picture"] as
        | string
        | undefined;

      if (!sub || !email) {
        // sesión inválida/incompleta → tratar como no autenticado
        return null;
      }

      const dbUser = await ctx.prisma.user.findUnique({
        where: { auth0Sub: sub },
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      });

      if (!dbUser) return null;

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

  /** === CHANGE PASSWORD === */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }),
    )
    .output(z.object({ ok: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.dbUser!.id },
        select: { password: true },
      });

      if (!dbUser?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este usuario no tiene contraseña local",
        });
      }

      const isValid = await argon2.verify(
        dbUser.password,
        input.currentPassword,
      );
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Contraseña actual inválida",
        });
      }

      const hashed = await argon2.hash(input.newPassword);
      await ctx.prisma.user.update({
        where: { id: ctx.dbUser!.id },
        data: { password: hashed },
      });

      return { ok: true };
    }),
});
