import { adminProcedure, router } from "../router";

export const adminRouter = router({
  listUsers: adminProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true, roles: { include: { role: true } } },
    })
  ),
});
