import { z } from 'zod';

export const User = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof User>;

export const Session = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  expiresAt: z.coerce.date(),
});
export type Session = z.infer<typeof Session>;
