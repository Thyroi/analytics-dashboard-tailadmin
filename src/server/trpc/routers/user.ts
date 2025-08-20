// server/trpc/routers/user.ts
import { Prisma } from "@prisma/client";
import { protectedProcedure, router } from "../router";
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
  // === GET ME ===
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
        profile: user.profile
          ? {
              ...user.profile,
              social,
            }
          : null,
      };
    }),

  // === UPDATE / UPSERT PROFILE ===
  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .output(ProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { social, ...rest } = input;

      // Tipado estricto para Prisma
      const updateData: Prisma.ProfileUpdateInput = {
        ...rest,
        // si viene undefined no se toca; si es null se guarda {} ; si objeto se guarda tal cual
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
