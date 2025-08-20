import { router } from "./router";
import { adminRouter } from "./routers/admin";
import { userRouter } from "./routers/user";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
});
export type AppRouter = typeof appRouter;
