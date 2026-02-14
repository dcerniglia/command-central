import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Container } from 'inversify';
import { SYMBOLS } from '../di/symbols.js';
import { AuthService } from '../services/auth-service.js';
import type { TRPCContext } from './trpc.js';

export function createContextFactory(container: Container) {
  return async ({ req, res }: CreateExpressContextOptions): Promise<TRPCContext> => {
    const sessionId = req.cookies?.session ?? null;
    let user = null;

    if (sessionId) {
      const authService = container.get<AuthService>(SYMBOLS.AuthService);
      user = await authService.validateSession(sessionId);
    }

    return { container, user, sessionId, res };
  };
}
