import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
// AppRouter type imported from server package for end-to-end type safety
import type { AppRouter } from '../../../server/src/trpc/router.js';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    ],
  });
}
