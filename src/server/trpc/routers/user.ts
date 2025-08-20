import { z } from "zod";
import { protectedProcedure, router } from "../router";

const ProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  bio: z.string().max(1000).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  social: z
    .object({
      linkedin: z.string().url().optional(),
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      x: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .partial()
    .optional(),
});

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.dbUser!.id },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }),

  updateProfile: protectedProcedure
    .input(ProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.profile.upsert({
        where: { userId: ctx.dbUser!.id },
        update: { ...input },
        create: { userId: ctx.dbUser!.id, ...input },
      });
    }),
});
