import type { AppRouter } from '@acme/api/trpc';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, loggerLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink(),
    splitLink({
      // uses the httpSubscriptionLink for subscriptions
      condition: op => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        url: '/api/trpc',
      }),
      false: httpBatchLink({
        url: '/api/trpc',
      }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
