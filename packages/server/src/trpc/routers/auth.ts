import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SYMBOLS } from '../../di/symbols.js';
import { AuthService } from '../../services/auth-service.js';

function setSessionCookie(ctx: any, sessionId: string, expiresAt: Date) {
  ctx.res.cookie('session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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

  // Test-only: create a session without WebAuthn (never available in production)
  devLogin: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('devLogin is not available in production');
      }
      const authService = ctx.container.get<AuthService>(SYMBOLS.AuthService);
      // Create user if not exists, then create session
      const { sessionId, expiresAt } = await authService.devLogin(input.username);
      setSessionCookie(ctx, sessionId, expiresAt);
      return { success: true };
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
