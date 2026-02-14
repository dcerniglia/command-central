import { router } from './trpc.js';
import { authRouter } from './routers/auth.js';
import { tasksRouter } from './routers/tasks.js';
import { jiraRouter } from './routers/jira.js';

export const appRouter = router({
  auth: authRouter,
  tasks: tasksRouter,
  jira: jiraRouter,
});

export type AppRouter = typeof appRouter;
