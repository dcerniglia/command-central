import { createTRPCReact } from '@trpc/react-query';

// AppRouter type imported from server package for end-to-end type safety
import type { AppRouter } from '../../../server/src/trpc/router.js';

export const trpc = createTRPCReact<AppRouter>();

// Default API URL — override via environment variable for production
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
