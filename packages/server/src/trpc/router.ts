import { router } from './trpc.js';
import { authRouter } from './routers/auth.js';
import { tasksRouter } from './routers/tasks.js';

export const appRouter = router({
  auth: authRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;
