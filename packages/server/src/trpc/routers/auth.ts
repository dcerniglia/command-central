import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SYMBOLS } from '../../di/symbols.js';
import { AuthService } from '../../services/auth-service.js';

function setSessionCookie(ctx: any, sessionId: string, expiresAt: Date) {
  ctx.res.cookie('session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // localhost
    expires: expiresAt,
    path: '/',
  });
}

export const authRouter = router({
  hasUsers: publicProcedure.query(async ({ ctx }) => {
    const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
    return authService.hasUsers();
  }),

  registrationOptions: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
      return authService.getRegistrationOptions(input.username);
    }),

  verifyRegistration: publicProcedure
    .input(z.object({ username: z.string().min(1), response: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
      const { sessionId, expiresAt } = await authService.verifyRegistration(input.username, input.response);
      setSessionCookie(ctx, sessionId, expiresAt);
      return { success: true };
    }),

  authenticationOptions: publicProcedure.mutation(async ({ ctx }) => {
    const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
    return authService.getAuthenticationOptions();
  }),

  verifyAuthentication: publicProcedure
    .input(z.object({ response: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
      const { sessionId, expiresAt } = await authService.verifyAuthentication(input.response);
      setSessionCookie(ctx, sessionId, expiresAt);
      return { success: true };
    }),

  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.sessionId) {
      const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
      await authService.deleteSession(ctx.sessionId);
    }
    ctx.res.clearCookie('session', { path: '/' });
    return { success: true };
  }),
});
