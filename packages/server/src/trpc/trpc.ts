import { initTRPC, TRPCError } from '@trpc/server';
import type { Container } from 'inversify';
import type { Response } from 'express';
import type { User } from '@cc/shared';

export interface TRPCContext {
  container: Container;
  user: User | null;
  sessionId: string | null;
  res: Response;
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
