import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient, trpc } from '../lib/trpc';
import { authClient } from '../lib/auth-client';
import { useSubscription } from '@trpc/tanstack-react-query';

const TickerComponent = () => {
  useSubscription(
    trpc.ticker.subscriptionOptions(void 0, {
      onData(data) {
        console.log('data', data);
      },
    }),
  );

  return <div>Ticker?</div>;
};

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { data } = authClient.useSession();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: window.location.href,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          alert('You have been signed out');
        },
      },
    });
  };

  return (
    <>
      <div>
        {!data?.session && (
          <button type="button" onClick={handleSignIn}>
            Sign in
          </button>
        )}
        {data?.session && (
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </div>
      <div>Hello "__root"!</div>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <TickerComponent />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </>
  );
}
